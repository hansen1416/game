import pybullet as p
from dataclasses import dataclass


@dataclass
class Joint:
    index: int
    name: str
    type: int
    gIndex: int
    uIndex: int
    flags: int
    damping: float
    friction: float
    lowerLimit: float
    upperLimit: float
    maxForce: float
    maxVelocity: float
    linkName: str
    axis: tuple
    parentFramePosition: tuple
    parentFrameOrientation: tuple
    parentIndex: int

    def __post_init__(self):
        self.name = str(self.name, 'utf-8')
        self.linkName = str(self.linkName, 'utf-8')


def display_joints_info(urdf_id, client_id=None):
    """
    type of the joint, this also implies the number of position and velocity variables.
    JOINT_REVOLUTE, JOINT_PRISMATIC, JOINT_SPHERICAL, JOINT_PLANAR, JOINT_FIXED. 
    See the section on Base, Joint and Links for more details.
    """
    n_joints = p.getNumJoints(urdf_id, physicsClientId=client_id)

    print("==========joints info=========")

    for i in range(n_joints):
        joint = Joint(*p.getJointInfo(urdf_id, i, physicsClientId=client_id))
        print(joint)

    print("==========joints info=========")
