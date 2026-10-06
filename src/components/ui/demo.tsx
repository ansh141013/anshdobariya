import { NotchedProjectCard } from "@/components/ui/notched-project-card";

/* Three robotics & automation projects tailored for Ansh Dobariya's engineering portfolio */

export default function Demo() {
  return (
    <div className="grid w-full max-w-6xl gap-x-6 gap-y-12 p-6 min-[700px]:grid-cols-3 lg:gap-x-8 lg:p-8">
      {/* 01: Emergency Medical Delivery Robot */}
      <NotchedProjectCard
        href="#contact"
        title="Emergency Medical Delivery Robot"
        description="Autonomous hospital AGV designed to transport critical medicines and sterile supplies with LiDAR SLAM, dynamic path re-planning, and secure cargo bay integration."
        image="https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=1200&q=85"
        badge="Robofest 2025"
        tags={["ROS 2", "SLAM Navigation", "Obstacle Avoidance"]}
        monochrome
        accent="#FF6A00"
        accentForeground="#FFFFFF"
      />
      {/* 02: 6 DOF Robotic Arm Simulation */}
      <NotchedProjectCard
        href="#contact"
        title="6 DOF Robotic Arm Simulation"
        description="Six-axis robotic arm simulation focusing on inverse kinematics, real-time trajectory optimization, and teleoperation for precision pick-and-place tasks."
        image="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=85"
        badge="Simulation 2024"
        tags={["MoveIt", "Inverse Kinematics", "Fusion 360 CAD"]}
        monochrome
        accent="#FF6A00"
        accentForeground="#FFFFFF"
      />
      {/* 03: TableTap Restaurant Automation */}
      <NotchedProjectCard
        href="#contact"
        title="TableTap Automation Platform"
        description="Contactless QR ordering and real-time operations orchestrator connecting dining tables, smart IoT kitchen sensors, and staff fulfillment workflows."
        image="https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=1200&q=85"
        badge="Full Stack 2023"
        tags={["Full Stack", "IoT System", "Realtime Web"]}
        monochrome
        accent="#FF6A00"
        accentForeground="#FFFFFF"
      />
    </div>
  );
}
