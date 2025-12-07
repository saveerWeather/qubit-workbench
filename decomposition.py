from typing import Any
import numpy as np
from scipy.stats import unitary_group
from qiskit.synthesis import TwoQubitBasisDecomposer
from qiskit.circuit.library import iSwapGate, CZGate
from qiskit.quantum_info import Operator
import numpy as np
from scipy.stats import unitary_group

from qiskit.synthesis import OneQubitEulerDecomposer

def decompose_gate(U,mode): 
    iSwap = iSwapGate()
    CZ = CZGate()

    decomposer = TwoQubitBasisDecomposer(iSwap)
    if mode=="CZ":
        relevant = CZ
    elif mode=="iSwap":
        relevant = iSwap
    decomposer = TwoQubitBasisDecomposer(relevant)
    circuit = decomposer(Operator(U))
    print(circuit.draw())
    

    relevant_matrices = []
    tags = []

    
    def operation(gate, qubit_indices):

        gate_matrix = Operator(gate).data
        #relevant_matrices.append(gate_matrix)
        tag = None
        if gate_matrix.shape == (2,2):
            qubit_idx = qubit_indices[0]
            if qubit_idx == 0:
                tag = 0
                Ug= np.kron(np.eye(2), gate_matrix)
            elif qubit_idx == 1:
                tag = 1
                Ug = np.kron(gate_matrix, np.eye(2))
            else:
                assert False, f"Invalid qubit index: {qubit_idx}"
        else:
            Ug = gate_matrix
            tag = 2
        return Ug, gate_matrix, tag

    Useries = []
    start = np.eye(4)
    for CI in circuit.data:
        qubit_indices = [circuit.qubits.index(q) for q in CI.qubits]
        Ug, GM, tag = operation(CI.operation, qubit_indices)
        Useries.append(Ug)
        relevant_matrices.append(GM)
        tags.append(tag)

        start = Useries[-1] @ start

    # FIX 4: Apply global phase
    start = np.exp(1j * circuit.global_phase) * start

    assert np.allclose(start, U), "Decomposition is incorrect"

    return relevant_matrices,tags,circuit



from dataclasses import dataclass

@dataclass
class physical_instruction:
    code: str
    title: str
    tag: int
    underlying_gate: Any
    instruction_string: str
    details: str
    angle: float = None
    


from qiskit.synthesis import OneQubitEulerDecomposer
from qiskit.circuit.library import iSwapGate, CZGate

def round3(x):
    return np.round(x,3)
def InstructionSet(RM,tags, mode, rparams):

    decomposer_zyz = OneQubitEulerDecomposer(basis='ZYZ')
    InstructionSet = []
    
    for i in range(len(RM)):

        if tags[i] == 2:
            if mode=="iSwap":
                code = "ISWAP"
                title = "iSwap Gate"
                underlying_gate = iSwapGate()
                instruction_string = f"Tune Qubit 1 to the frequency of Qubit 0 for pi/(4g) seconds, constant g. "
                details = f"This is a physical operation that realizes the iSwap gate. Apply a DC flux pulse over the transmon's SQUID loop to modify the flux through the loop and change the qubits drive frequency. By placing the two qubits in resonance, the natural entangling interaction between the two qubits is activated and realizes the iSwap gate over time. The time is given by pi/(4g), where g is the coupling strength between the two qubits. g is computed directly from the interaction Hamiltonian of the system based on the capacitance of each qubit and the coupling capacitance."
                #param format: [time, time_label]
               
                InstructionSet.append(physical_instruction(code,title,tags[i], underlying_gate, instruction_string, details,angle=None))
               
            elif mode=="CZ":
                assert False, "CZ gate is not implemented yet."
            
        else:
           
            ZYZ = decomposer_zyz(RM[i])
            #sometimes ZYZ is in format YZ or ZY or just Z or just Y . we must check for this
            one_on = True
            two_on = True
            three_on = True
            if(len(ZYZ.data) == 0):
                one_on = False
                two_on = False
                three_on = False
            if(len(ZYZ.data) == 1):
                if(ZYZ.data[0].operation.name == "rz"):
                    #gate is just a virtual Z rotation
                    one_on = True
                    two_on = False
                    three_on = False
                else:
                    one_on = False
                    two_on = True
                    three_on = False
            if(len(ZYZ.data) == 2):
                if(ZYZ.data[0].operation.name == "rz"):
                    one_on = True
                    two_on = True
                    three_on = False
                else:
                    one_on = False
                    two_on = True
                    three_on = True

            if tags[i] == 0:
                count = 0 
                #gate 1 (virtual Z rotation)
                if(one_on):
                    instruction,angle1 = genZInstruction(ZYZ.data[count],rparams,0)
                    rparams.q0current_relative_phase += angle1
                    InstructionSet.append(instruction)
                    count += 1
                #gate 2 (Y gate)
                if(two_on):
                    instruction2 = genYInstruction(ZYZ.data[count],rparams,0)
                    InstructionSet.append(instruction2)
                    count += 1
                #gate 3 (virtual Z rotation)
                if(three_on):
                    instruction3,angle3= genZInstruction(ZYZ.data[count],rparams,0)
                    rparams.q0current_relative_phase += angle3
                    InstructionSet.append(instruction3)
                    count += 1

            elif tags[i] == 1:
                #gate 1 (virtual Z rotation)
                count = 0 
                if(one_on):
                    instruction,angle3 = genZInstruction(ZYZ.data[count],rparams,1)
                    rparams.q1current_relative_phase += angle3
                    InstructionSet.append(instruction)
                    count += 1
                #gate 2 (Y gate)
                if(two_on):
                    instruction2 = genYInstruction(ZYZ.data[count],rparams,1)
                    InstructionSet.append(instruction2)
                    count += 1
                #gate 3 (virtual Z rotation)
                if(three_on):
                    instruction3,angle3 = genZInstruction(ZYZ.data[count],rparams,1)
                    rparams.q1current_relative_phase += angle3
                    InstructionSet.append(instruction3)
                    count += 1
     
    return InstructionSet,rparams

def genZInstruction(circuitinstruction,rparams,tag):
    g = circuitinstruction.operation
    angle = g.params[0]
    gatem = Operator(g).data
    code = "RZ"
    title = f"Z-axis rotation of ~{round3(angle)} radians on Qubit {tag}"
    if tag == 0:
        underlying_gate = np.kron(np.eye(2), gatem)
    elif tag == 1:
        underlying_gate = np.kron(gatem, np.eye(2))
    else:
        assert False, f"Invalid qubit index: {tag}"
    instruction_string = f"Virtual (bookkeeping) Z-axis phase rotation"
    details = f"Phase rotations do not need to be applied physically. By shifting the phase our computational basis, we can effectively apply a Z rotation on Qubit 0 in 0 time. All future applied radiation will be prepared with a phase shift that matches how much we virtually rotated around the Z-axis."
    return physical_instruction(code,title,tag, underlying_gate, instruction_string, details,angle),angle
def genYInstruction(circuitinstruction,rparams,tag):
    g = circuitinstruction.operation
    
    gatem = Operator(g).data
    code = "RY"
    angle = g.params[0]
    title = f"Y-axis rotation of ~{round3(angle)} radians on Qubit {tag}"
 
    if tag == 0:
        qdrive_freq = rparams.q0drive_freq
        underlying_gate = np.kron(np.eye(2), gatem)
        usephase = rparams.q0current_relative_phase
    elif tag == 1:
        qdrive_freq = rparams.q1drive_freq
        underlying_gate = np.kron(gatem, np.eye(2))
        usephase = rparams.q1current_relative_phase
    else:
        assert False, f"Invalid qubit index: {tag}"
    time = angle/rparams.rabi_frequency
    instruction_string = f"Apply electromagnetic radiation to qubit {tag} through it's Drive capacitor "
    details = f"""Drive Frequency: {round3(qdrive_freq*(1e-9))} GHz 
Phase: PI/2 + Current Relative Phase: {round3(np.pi/2 + usephase)} radians 
Amplitude: k* {round3(rparams.rabi_frequency*(1e-6))} MHz 
Time: {round3(time*1e9)} ns<split>Applying a rotation around the Y axis is via phase = PI/2, since this phase produces a pure Pauli Y rotation in the drive hamiltonian. The amplitude of the drive is k*rabi_frequency, where k is a constant must be calibrated on a real system. We must also factor in our current relative phase (so that the virtual Z rotations are considered). The speed of this rotation is dictated by the Rabi Frequency (time =theta/rabi)"""
    return physical_instruction(code,title, tag, underlying_gate, instruction_string, details,angle)
@dataclass
class relevant_parameters:
    rabi_frequency: float 
    q0drive_freq: float
    q1drive_freq: float
    q0current_relative_phase: float
    q1current_relative_phase: float


