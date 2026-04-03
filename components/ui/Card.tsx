interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-parchment-50 rounded-xl shadow-sm border border-parchment-300 ${className}`}>
      {children}
    </div>
  );
}
