import type { SVGProps } from 'react';

const Logo = (props: SVGProps<SVGSVGElement> & { size?: number }) => {
  const { size = 32, ...rest } = props;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Lebarone Finanças Logo"
      {...rest}
    >
      <path
        d="M50 10 L10 80 H90 L50 10 Z"
        className="fill-primary group-hover/logo:fill-primary-foreground transition-colors"
      />
      <text
        x="50"
        y="70"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="40"
        fontWeight="bold"
        textAnchor="middle"
        className="fill-background group-hover/logo:fill-primary transition-colors"
      >
        $
      </text>
    </svg>
  );
};

export default Logo;
