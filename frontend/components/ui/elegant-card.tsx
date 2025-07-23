"use client"

import {ReactNode, useRef, useState} from "react";

interface ElegantCardWrapperProps {
    styleProperties?: string;
    children: ReactNode;
}

 export const ElegantCardWrapper = ({ styleProperties = '', children } : ElegantCardWrapperProps ) => {
    const cardRef = useRef(null);
    const [tiltStyle, setTiltStyle] = useState({});

    const handleMouseMove = (e: { clientX: number; clientY: number; }) => {
        if (!cardRef.current) return;
        const card = cardRef.current as HTMLDivElement;
        const { left, top, width, height } = card.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;

        // Calculate tilt: max 16deg horizontal, 10deg vertical, inverted for natural feel
        const rotateY = (mouseX / width) * 32; // Scale to max ~16deg
        const rotateX = -(mouseY / height) * 20; // Scale to max ~10deg, invert for up/down

        setTiltStyle({
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        });
    };

    const handleMouseLeave = () => {
        setTiltStyle({
            transform: 'rotateX(2deg) rotateY(2deg)', // Reset to subtle initial tilt
        });
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`${styleProperties} [transform-style:preserve-3d] [perspective:500px] 
            [transform:rotateX(2deg)_rotateY(2deg)] transition-transform duration-300 
                    ease-in-out hover:[transform:rotateX(10deg)_rotateY(16deg)]`}
            style={tiltStyle} // Overrides with dynamic tilt
        >
            {children}
        </div>
    );
};