import React from 'react';
import {
  siRos,
  siPython,
  siC,
  siCplusplus,
  siJavascript,
  siTypescript,
  siEspressif,
  siRaspberrypi,
  siReact,
  siNextdotjs,
  siFirebase,
} from 'simple-icons';
import {
  Bot,
  Radar,
  Radio,
  DraftingCompass,
  Cog,
  Box,
  ScanEye,
  BrainCircuit,
  Brain,
  Cpu,
  CircuitBoard,
  Globe,
  LucideProps,
} from 'lucide-react';

interface IconProps {
  size?: number;
  className?: string;
}

export function SimpleIconWrapper({ icon, size = 22, className = '' }: { icon: { path: string; title: string }; size?: number; className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={`shrink-0 transition-transform ${className}`}
      aria-label={icon.title}
    >
      <path d={icon.path} />
    </svg>
  );
}

export function RoboticGripperIcon({ size = 22, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="Robot Manipulation"
    >
      <rect x="8" y="18" width="8" height="4" rx="1" />
      <line x1="12" y1="18" x2="12" y2="13" />
      <line x1="6" y1="13" x2="18" y2="13" />
      <path d="M6 13V8a2 2 0 0 1 2-2h1" />
      <path d="M18 13V8a2 2 0 0 0-2-2h-1" />
      <circle cx="12" cy="6" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function ActuatorMotorIcon({ size = 22, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="Actuators"
    >
      <rect x="5" y="6" width="14" height="12" rx="2" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <path d="M9 3.5a3.5 3.5 0 0 1 6 0" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <line x1="9" y1="14" x2="15" y2="14" />
      <line x1="8" y1="18" x2="8" y2="21" />
      <line x1="16" y1="18" x2="16" y2="21" />
    </svg>
  );
}

export function MotionControlIcon({ size = 22, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="Motion Control"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <polyline points="3 3 3 8 8 8" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <polyline points="16 16 21 16 21 21" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

export function Fusion360Icon({ size = 22, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="currentColor"
      className={className}
      aria-label="Autodesk Fusion 360"
    >
      <path d="M223.35 117.445c.033 65.866.333 131.765-.133 197.664 16.808 1.864 34.048 2.43 50.79-.6-.933-25.959-.034-51.952-.533-77.914 21.434-2.295 43.033-.565 64.534-1.198-.265-11.548-.233-23.064.033-34.613-21.433-.133-42.9.2-64.367-.2-.2-15.576-.167-31.186-.035-46.762 25.528.034 51.09-.066 76.617.1.067-12.214-.033-24.462-.066-36.71-42.27.298-84.572-.034-126.84.233M94.314 36.335h339.148c13.013.666 26.26 10.052 26.993 23.83.799 19.237-.033 38.542.265 57.812.2 92.458.034 184.917.101 277.343-106.138.1-212.276-.067-318.413.133-15.942.434-31.919 1.232-47.861-.133-.832-119.484-.367-238.969-.266-358.453l.033-.531z" />
      <path d="M16 84.196C41.794 67.954 68.087 52.48 94.281 36.868c-.101 119.484-.567 238.968.266 358.453-12.048 7.122-23.964 14.477-36.045 21.6C44.29 425.409 30.245 434.13 16 442.582V84.196z" opacity="0.85" />
      <path d="M460.72 117.978c11.75-.1 23.532-.1 35.28-.133-.266 119.285-.033 238.535-.133 357.82H82.565c-10.75-1.665-21.267-8.82-23.43-20.002-2.064-12.814-.566-25.861-.633-38.741 12.082-7.123 23.997-14.48 36.045-21.601 15.943 1.365 31.918.566 47.86.134 106.137-.201 212.276-.034 318.414-.134-.067-92.426.1-184.884-.1-277.343" opacity="0.65" />
    </svg>
  );
}

// Icon mapper for any skill name
export function renderSkillIcon(skillName: string, size = 22): React.ReactNode {
  switch (skillName) {
    // 01. Robotics
    case 'ROS':
      return <SimpleIconWrapper icon={siRos} size={size} />;
    case 'Robotics':
      return <Bot size={size} strokeWidth={1.8} />;
    case 'Motion Control':
      return <MotionControlIcon size={size} />;
    case 'Robot Manipulation':
      return <RoboticGripperIcon size={size} />;
    case 'Sensors':
      return <Radio size={size} strokeWidth={1.8} />;
    case 'Actuators':
      return <ActuatorMotorIcon size={size} />;

    // 02. Programming
    case 'Python':
      return <SimpleIconWrapper icon={siPython} size={size} />;
    case 'C':
      return <SimpleIconWrapper icon={siC} size={size} />;
    case 'C++':
      return <SimpleIconWrapper icon={siCplusplus} size={size} />;
    case 'JavaScript':
      return <SimpleIconWrapper icon={siJavascript} size={size} />;
    case 'TypeScript':
      return <SimpleIconWrapper icon={siTypescript} size={size} />;

    // 03. Design & CAD
    case 'Fusion 360':
      return <Fusion360Icon size={size} />;
    case 'CAD':
      return <DraftingCompass size={size} strokeWidth={1.8} />;
    case 'Mechanical Design':
      return <Cog size={size} strokeWidth={1.8} />;
    case '3D Modeling':
      return <Box size={size} strokeWidth={1.8} />;

    // 04. AI / Vision
    case 'Computer Vision':
      return <ScanEye size={size} strokeWidth={1.8} />;
    case 'Machine Learning':
      return <BrainCircuit size={size} strokeWidth={1.8} />;
    case 'AI Systems':
      return <Brain size={size} strokeWidth={1.8} />;

    // 05. Embedded
    case 'ESP32':
      return <SimpleIconWrapper icon={siEspressif} size={size} />;
    case 'Raspberry Pi':
      return <SimpleIconWrapper icon={siRaspberrypi} size={size} />;
    case 'Microcontrollers':
      return <Cpu size={size} strokeWidth={1.8} />;
    case 'Motor Drivers':
      return <CircuitBoard size={size} strokeWidth={1.8} />;

    // 06. Software
    case 'React':
      return <SimpleIconWrapper icon={siReact} size={size} />;
    case 'Next.js':
      return <SimpleIconWrapper icon={siNextdotjs} size={size} />;
    case 'Firebase':
      return <SimpleIconWrapper icon={siFirebase} size={size} />;
    case 'Web Dev':
      return <Globe size={size} strokeWidth={1.8} />;

    default:
      return <Bot size={size} strokeWidth={1.8} />;
  }
}
