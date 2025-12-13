from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import numpy as np
import re
import os
import random

from sympy import sympify, I, latex as sympy_latex, N, re as sym_re, im as sym_im
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application

app = Flask(__name__, static_folder='.', static_url_path='')

CORS(app)

def calculate_separable_state_info(state_vector):
    c1, c2, c3, c4 = state_vector

    # get magnitudes for qubit 1
    alpha1_mag = np.sqrt(abs(c1)**2 + abs(c2)**2)
    beta1_mag = np.sqrt(abs(c3)**2 + abs(c4)**2)
    qubit1_norm = np.sqrt(alpha1_mag**2 + beta1_mag**2)
    if qubit1_norm > 1e-10:
        alpha1_norm = alpha1_mag / qubit1_norm
        beta1_norm = beta1_mag / qubit1_norm
    else:
        alpha1_norm = 1.0
        beta1_norm = 0.0

    # phase for qubit 1 basis
    if abs(c1) > 1e-10:
        alpha1_phase = c1 / abs(c1)
    elif abs(c2) > 1e-10:
        alpha1_phase = c2 / abs(c2)
    else:
        alpha1_phase = 1.0 + 0.0j

    if abs(c3) > 1e-10:
        beta1_phase = c3 / abs(c3)
    elif abs(c4) > 1e-10:
        beta1_phase = c4 / abs(c4)
    else:
        beta1_phase = 1.0 + 0.0j

    alpha_qubit1 = alpha1_norm * alpha1_phase
    beta_qubit1 = beta1_norm * beta1_phase

    # relative phase between alpha and beta (q1)
    if abs(alpha_qubit1) > 1e-10 and abs(beta_qubit1) > 1e-10:
        q1current_relative_phase = np.angle(beta_qubit1 / alpha_qubit1)
    else:
        q1current_relative_phase = 0.0

    # qubit 0 now
    gamma0_mag = np.sqrt(abs(c1)**2 + abs(c3)**2)
    delta0_mag = np.sqrt(abs(c2)**2 + abs(c4)**2)
    qubit0_norm = np.sqrt(gamma0_mag**2 + delta0_mag**2)
    if qubit0_norm > 1e-10:
        gamma0_norm = gamma0_mag / qubit0_norm
        delta0_norm = delta0_mag / qubit0_norm
    else:
        gamma0_norm = 1.0
        delta0_norm = 0.0

    if abs(c1) > 1e-10:
        gamma0_phase = c1 / abs(c1)
    elif abs(c3) > 1e-10:
        gamma0_phase = c3 / abs(c3)
    else:
        gamma0_phase = 1.0 + 0.0j
    if abs(c2) > 1e-10:
        delta0_phase = c2 / abs(c2)
    elif abs(c4) > 1e-10:
        delta0_phase = c4 / abs(c4)
    else:
        delta0_phase = 1.0 + 0.0j

    gamma_qubit0 = gamma0_norm * gamma0_phase
    delta_qubit0 = delta0_norm * delta0_phase

    # relative for q0
    if abs(gamma_qubit0) > 1e-10 and abs(delta_qubit0) > 1e-10:
        q0current_relative_phase = np.angle(delta_qubit0 / gamma_qubit0)
    else:
        q0current_relative_phase = 0.0

    def qubit_to_bloch(alpha, beta):
        alpha_conj = np.conj(alpha)
        x = 2 * (alpha_conj * beta).real
        y = 2 * (alpha_conj * beta).imag
        z = abs(alpha)**2 - abs(beta)**2
        return [float(x), float(y), float(z)]

    bloch_qubit1 = qubit_to_bloch(alpha_qubit1, beta_qubit1)
    bloch_qubit0 = qubit_to_bloch(gamma_qubit0, delta_qubit0)

    return {
        'bloch_qubit1': bloch_qubit1,
        'bloch_qubit0': bloch_qubit0,
        'qubit1_state': {
            'alpha': {'re': float(alpha_qubit1.real), 'im': float(alpha_qubit1.imag)},
            'beta': {'re': float(beta_qubit1.real), 'im': float(beta_qubit1.imag)}
        },
        'qubit0_state': {
            'gamma': {'re': float(gamma_qubit0.real), 'im': float(gamma_qubit0.imag)},
            'delta': {'re': float(delta_qubit0.real), 'im': float(delta_qubit0.imag)}
        },
        'q0current_relative_phase': float(q0current_relative_phase),
        'q1current_relative_phase': float(q1current_relative_phase)
    }


@app.route('/')
def serve_index():  # static serve index.html
    return send_from_directory('.', 'index.html')


@app.route('/evaluate_complex', methods=['POST'])
def evaluate_complex():
    try:
        data = request.json

        expr_str = data.get('expression', '0').strip()
        # some light parsing and symbol stuff
        expr_str = re.sub(r'\be\b', 'E', expr_str)
        expr_str = re.sub(r'(\d)i\b', r'\1*I', expr_str)
        expr_str = re.sub(r'\bi(pi|theta|phi)\b', r'I*\1', expr_str)   # i*pi etc fixes
        expr_str = re.sub(r'(^|[\+\-\*/\(\)\^])\s*i\s*(?=[\+\-\*/\)\^]|$)', r'\1I', expr_str)
        expr_str = re.sub(r'\bi\b', 'I', expr_str)
        expr_str = expr_str.replace('^', '**')   # python exponent
        transformations = standard_transformations + (implicit_multiplication_application,)
        expr = parse_expr(expr_str, transformations=transformations)

        latex_output = sympy_latex(expr)
        from sympy import simplify

        simplified = simplify(expr)
        real_part, imag_part = simplified.as_real_imag()
        real_float = float(real_part)
        imag_float = float(imag_part)
        return jsonify({
            'success': True,
            'real': real_float,
            'imag': imag_float,
            'latex': latex_output
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400



@app.route('/decompose', methods=['POST'])
def decompose():
    try:
        data = request.json
        # parse matrix expressions
        matrix_expressions = data['matrix']
        matrix = []
        for row in matrix_expressions:
            matrix_row = []
            for expr_str in row:
                expr_str = expr_str.strip()
                expr_str = re.sub(r'\be\b', 'E', expr_str)
                expr_str = re.sub(r'(\d)i\b', r'\1*I', expr_str)
                expr_str = re.sub(r'\bi(pi|theta|phi)\b', r'I*\1', expr_str)
                expr_str = re.sub(r'(^|[\+\-\*/\(\)\^])\s*i\s*(?=[\+\-\*/\)\^]|$)', r'\1I', expr_str)
                expr_str = re.sub(r'\bi\b', 'I', expr_str)
                expr_str = expr_str.replace('^', '**')
                transformations = standard_transformations + (implicit_multiplication_application,)
                expr = parse_expr(expr_str, transformations=transformations)
                from sympy import simplify
                simplified = simplify(expr)
                real_part, imag_part = simplified.as_real_imag()
                real_float = float(real_part)
                imag_float = float(imag_part)
                complex_val = complex(real_float, imag_float)
                matrix_row.append(complex_val)
            matrix.append(matrix_row)
        matrix = np.array(matrix, dtype=complex)

        # print
        print(matrix)

        is_unitary = np.allclose(matrix @ matrix.conj().T, np.identity(matrix.shape[0]), atol=1e-10)
        if not is_unitary:
            return jsonify({'success': False, 'error': 'Matrix is not unitary', 'is_unitary': False}), 400

        from decomposition import decompose_gate, relevant_parameters, InstructionSet

        rabi_frequency = float(data.get('rabi_frequency', 20e6))
        q0drive_freq = float(data.get('q0drive_freq', 5.3e9))
        q1drive_freq = float(data.get('q1drive_freq', 5e9))

        # phases, sometimes set from state
        q0current_relative_phase = 0.0
        q1current_relative_phase = 0.0
        if 'state_vector' in data:
            state_vector_dict = data['state_vector']
            state_vector = [complex(c['re'], c['im']) for c in state_vector_dict]
            c1, c2, c3, c4 = state_vector
            c1c4 = c1 * c4
            c2c3 = c2 * c3
            is_separable = abs(c1c4 - c2c3) < 1e-10
            if is_separable:
                alpha1_mag = np.sqrt(abs(c1)**2 + abs(c2)**2)
                beta1_mag = np.sqrt(abs(c3)**2 + abs(c4)**2)
                if alpha1_mag > 1e-10 and beta1_mag > 1e-10:
                    alpha1 = c1 / alpha1_mag if abs(c1) > 1e-10 else c2 / alpha1_mag if abs(c2) > 1e-10 else 1.0
                    beta1 = c3 / beta1_mag if abs(c3) > 1e-10 else c4 / beta1_mag if abs(c4) > 1e-10 else 0.0
                    q1current_relative_phase = np.angle(beta1 / alpha1) if abs(alpha1) > 1e-10 else 0.0
                gamma0_mag = np.sqrt(abs(c1)**2 + abs(c3)**2)
                delta0_mag = np.sqrt(abs(c2)**2 + abs(c4)**2)
                if gamma0_mag > 1e-10 and delta0_mag > 1e-10:
                    gamma0 = c1 / gamma0_mag if abs(c1) > 1e-10 else c3 / gamma0_mag if abs(c3) > 1e-10 else 1.0
                    delta0 = c2 / delta0_mag if abs(c2) > 1e-10 else c4 / delta0_mag if abs(c4) > 1e-10 else 0.0
                    q0current_relative_phase = np.angle(delta0 / gamma0) if abs(gamma0) > 1e-10 else 0.0

        rparams = relevant_parameters(
            rabi_frequency=rabi_frequency,
            q0drive_freq=q0drive_freq,
            q1drive_freq=q1drive_freq,
            q0current_relative_phase=q0current_relative_phase,
            q1current_relative_phase=q1current_relative_phase
        )


        mode = "iSwap"
        RM, tags, qcircuit = decompose_gate(matrix, mode)
        instructionset, final_rparams = InstructionSet(RM, tags, mode, rparams)

        instructions_json = []

        for instr in instructionset:
            gate_matrix = []
            if hasattr(instr.underlying_gate, 'tolist'):
                gate_array = instr.underlying_gate
            else:
                gate_array = np.array(instr.underlying_gate)
            for row in gate_array:
                gate_row = []
                for elem in row:
                    gate_row.append({'re': float(elem.real), 'im': float(elem.imag)})
                gate_matrix.append(gate_row)
            instructions_json.append({
                'code': instr.code,
                'title': instr.title,
                'tag': instr.tag,
                'instruction_string': instr.instruction_string,
                'details': instr.details,
                'angle': float(instr.angle) if instr.angle is not None else None,
                'underlying_gate': gate_matrix
            })


        return jsonify({
            'success': True, 
            'message': 'Matrix is unitary', 
            'is_unitary': True,
            'instructions': instructions_json
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400



@app.route('/decompose_gate', methods=['POST'])
@app.route('/decompose_state', methods=['POST'])
def decompose_state():
    try:
        data = request.json

        expressions = data.get('expressions', [])
        mode = data.get('mode', 'vector')

        def parse_complex_expr(expr_str):
            expr_str = expr_str.strip()
            if not expr_str:
                return 0.0 + 0.0j
            expr_str = re.sub(r'\be\b', 'E', expr_str)
            expr_str = re.sub(r'(\d)i\b', r'\1*I', expr_str)
            expr_str = re.sub(r'\bi(pi|theta|phi)\b', r'I*\1', expr_str)
            expr_str = re.sub(r'(^|[\+\-\*/\(\)\^])\s*i\s*(?=[\+\-\*/\)\^]|$)', r'\1I', expr_str)
            expr_str = re.sub(r'\bi\b', 'I', expr_str)
            expr_str = expr_str.replace('^', '**')
            transformations = standard_transformations + (implicit_multiplication_application,)
            expr = parse_expr(expr_str, transformations=transformations)
            from sympy import simplify

            simplified = simplify(expr)
            real_part, imag_part = simplified.as_real_imag()
            real_float = float(real_part)
            imag_float = float(imag_part)
            return complex(real_float, imag_float)

        # two ways to interpret inputs
        if mode == 'vector':
            c1 = parse_complex_expr(expressions[0] if len(expressions) > 0 else '0')
            c2 = parse_complex_expr(expressions[1] if len(expressions) > 1 else '0')
            c3 = parse_complex_expr(expressions[2] if len(expressions) > 2 else '0')
            c4 = parse_complex_expr(expressions[3] if len(expressions) > 3 else '0')
        else:
            alpha = parse_complex_expr(expressions[0] if len(expressions) > 0 else '1')
            beta = parse_complex_expr(expressions[1] if len(expressions) > 1 else '0')
            gamma = parse_complex_expr(expressions[2] if len(expressions) > 2 else '1')
            delta = parse_complex_expr(expressions[3] if len(expressions) > 3 else '0')
            norm1 = np.sqrt(abs(alpha)**2 + abs(beta)**2)
            if norm1 > 1e-10:
                alpha = alpha / norm1
                beta = beta / norm1
            else:
                alpha = 1.0 + 0.0j
                beta = 0.0 + 0.0j
            norm0 = np.sqrt(abs(gamma)**2 + abs(delta)**2)
            if norm0 > 1e-10:
                gamma = gamma / norm0
                delta = delta / norm0
            else:
                gamma = 1.0 + 0.0j
                delta = 0.0 + 0.0j
            c1 = alpha * gamma
            c2 = alpha * delta
            c3 = beta * gamma
            c4 = beta * delta

        state_vector = [c1, c2, c3, c4]

        # normalize
        norm = np.sqrt(sum(abs(c)**2 for c in state_vector))
        if norm > 1e-10:
            state_vector = [c / norm for c in state_vector]
        else:
            return jsonify({'success': False, 'error': 'State vector is zero'}), 400

        probabilities = [abs(c)**2 for c in state_vector]

        c1c4 = state_vector[0] * state_vector[3]
        c2c3 = state_vector[1] * state_vector[2]
        is_separable = abs(c1c4 - c2c3) < 1e-10

        result = {
            'success': True,
            'coefficients': [
                {'re': float(c.real), 'im': float(c.imag)} for c in state_vector
            ],
            'probabilities': probabilities,
            'is_separable': is_separable
        }

        if is_separable:
            separable_info = calculate_separable_state_info(state_vector)
            result.update(separable_info)
        else:
            result['q0current_relative_phase'] = 0.0
            result['q1current_relative_phase'] = 0.0

        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400



@app.route('/measure_qubit', methods=['POST'])
def measure_qubit():
    try:
        data = request.json
        qubit_index = data.get('qubit_index', 0)
        state_vector_dict = data.get('state_vector')
        if not state_vector_dict:
            return jsonify({'success': False, 'error': 'No state vector provided'}), 400


        state_vector = [complex(c['re'], c['im']) for c in state_vector_dict]

        # choose which qubit to collapse
        if qubit_index == 0:
            prob_0 = abs(state_vector[0])**2 + abs(state_vector[2])**2
            prob_1 = abs(state_vector[1])**2 + abs(state_vector[3])**2
        else:
            prob_0 = abs(state_vector[0])**2 + abs(state_vector[1])**2
            prob_1 = abs(state_vector[2])**2 + abs(state_vector[3])**2

        total_prob = prob_0 + prob_1
        if total_prob < 1e-10:
            return jsonify({'success': False, 'error': 'State vector is zero'}), 400

        prob_0 = prob_0 / total_prob
        prob_1 = prob_1 / total_prob  # (not really used below)

        measurement_result = 0 if random.random() < prob_0 else 1

        # collapse the state
        collapsed_state = [0.0 + 0.0j, 0.0 + 0.0j, 0.0 + 0.0j, 0.0 + 0.0j]
        if qubit_index == 0:
            if measurement_result == 0:
                collapsed_state[0] = state_vector[0]
                collapsed_state[2] = state_vector[2]
            else:
                collapsed_state[1] = state_vector[1]
                collapsed_state[3] = state_vector[3]
        else:
            if measurement_result == 0:
                collapsed_state[0] = state_vector[0]
                collapsed_state[1] = state_vector[1]
            else:
                collapsed_state[2] = state_vector[2]
                collapsed_state[3] = state_vector[3]

        norm = np.sqrt(sum(abs(c)**2 for c in collapsed_state))
        if norm > 1e-10:
            collapsed_state = [c / norm for c in collapsed_state]
        else:
            return jsonify({'success': False, 'error': 'Collapsed state is zero'}), 400

        probabilities = [abs(c)**2 for c in collapsed_state]

        c1c4 = collapsed_state[0] * collapsed_state[3]
        c2c3 = collapsed_state[1] * collapsed_state[2]
        is_separable = abs(c1c4 - c2c3) < 1e-10

        result = {
            'success': True,
            'measurement_result': measurement_result,
            'prob_0': prob_0,
            'prob_1': prob_1,
            'coefficients': [
                {'re': float(c.real), 'im': float(c.imag)} for c in collapsed_state
            ],
            'probabilities': probabilities,
            'is_separable': is_separable
        }

        if is_separable:
            separable_info = calculate_separable_state_info(collapsed_state)
            result.update(separable_info)
        else:
            result['q0current_relative_phase'] = 0.0
            result['q1current_relative_phase'] = 0.0

        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400



@app.route('/apply_gate', methods=['POST'])
def apply_gate():
    try:
        data = request.json
        state_vector_dict = data.get('state_vector')
        gate_matrix_dict = data.get('gate_matrix')
        if not state_vector_dict or not gate_matrix_dict:
            return jsonify({'success': False, 'error': 'Missing state_vector or gate_matrix'}), 400

        state_vector = [complex(c['re'], c['im']) for c in state_vector_dict]
        gate_matrix = []
        for row in gate_matrix_dict:
            gate_row = [complex(elem['re'], elem['im']) for elem in row]
            gate_matrix.append(gate_row)
        gate_matrix = np.array(gate_matrix, dtype=complex)

        state_vector_array = np.array(state_vector)
        new_state = gate_matrix @ state_vector_array
        new_state_list = [complex(c) for c in new_state]

        probabilities = [abs(c)**2 for c in new_state_list]

        c1, c2, c3, c4 = new_state_list
        c1c4 = c1 * c4
        c2c3 = c2 * c3
        is_separable = abs(c1c4 - c2c3) < 1e-10

        print(is_separable)
        print("LOOK ABOVE THIS")

        result = {
            'success': True,
            'coefficients': [
                {'re': float(c.real), 'im': float(c.imag)} for c in new_state_list
            ],
            'probabilities': probabilities,
            'is_separable': is_separable
        }

        if is_separable:
            separable_info = calculate_separable_state_info(new_state_list)
            result.update(separable_info)
        else:
            result['q0current_relative_phase'] = 0.0
            result['q1current_relative_phase'] = 0.0
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400



if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
