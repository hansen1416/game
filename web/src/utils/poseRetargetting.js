import * as THREE from "three";
import { clamp, BlazePoseKeypointsValues, MDMJoints } from "../utils/ropes";

function rotateLimb(
    bone_name,
    parent_bone_name,
    start_joint_name,
    end_joint_name,
    init_euler,
    up_vector,
    angle_restrain
) {
    // if (
    // 	(this.pose3D[this.joints_map[start_joint_name]] &&
    // 		this.pose3D[this.joints_map[start_joint_name]]
    // 			.visibility < 0.5) ||
    // 	(this.pose3D[this.joints_map[end_joint_name]] &&
    // 		this.pose3D[this.joints_map[end_joint_name]]
    // 			.visibility < 0.5)
    // ) {
    // 	return;
    // }

    const start_joint = this.pose3D[this.joints_map[start_joint_name]];
    const end_joint = this.pose3D[this.joints_map[end_joint_name]];

    const world_target_vector = new THREE.Vector3(
        end_joint.x - start_joint.x,
        end_joint.y - start_joint.y,
        end_joint.z - start_joint.z
    ).normalize();

    const world_quaternion = new THREE.Quaternion();

    this.bones[parent_bone_name].getWorldQuaternion(world_quaternion);

    // after apply the parent quaternion,
    // `world_target_vector` actually became the local target vector
    world_target_vector.applyQuaternion(world_quaternion.conjugate());

    // store the local vectors for all bones, used for gesture classification
    // this.local_vectors[bone_name] = world_target_vector.clone();

    // all the bones rest pose in the model is (0,1,0)
    // first place the limb to the human body nature position
    const init_quaternion = new THREE.Quaternion().setFromEuler(init_euler);

    // this is the real human body rotation,
    // todo, limit this rotation by human body restrain
    // todo, use matrix basis rotations to adjust the orientations
    let local_quaternion_bio = new THREE.Quaternion().setFromUnitVectors(
        up_vector,
        world_target_vector
    );

    if (angle_restrain) {
        const angles = new THREE.Euler().setFromQuaternion(
            local_quaternion_bio
        );

        angles.x = clamp(
            angles.x,
            angle_restrain.x[0],
            angle_restrain.x[1]
        );
        angles.y = clamp(
            angles.y,
            angle_restrain.y[0],
            angle_restrain.y[1]
        );
        angles.z = clamp(
            angles.z,
            angle_restrain.z[0],
            angle_restrain.z[1]
        );

        local_quaternion_bio = new THREE.Quaternion().setFromEuler(angles);
    }

    /*
    Notice that rotating by `a` and then by `b` is equivalent to 
    performing a single rotation by the quaternion product `ba`. 
    This is a key observation.
    */
    const local_quaternion_bone =
        new THREE.Quaternion().multiplyQuaternions(
            local_quaternion_bio,
            init_quaternion
        );

    // const angle = local_quaternion_bone.angleTo(new THREE.Quaternion());

    // const axis = new THREE.Vector3(
    // 	local_quaternion_bone.x,
    // 	local_quaternion_bone.y,
    // 	local_quaternion_bone.z
    // );

    // const local_quaternion_round = new THREE.Quaternion().setFromAxisAngle(
    // 	axis,
    // 	parseFloat(angle.toFixed(2)) // this will cause the left arm unable to hang down
    // );

    this.bones[bone_name].rotation.setFromQuaternion(
        local_quaternion_bone.normalize()
    );
}