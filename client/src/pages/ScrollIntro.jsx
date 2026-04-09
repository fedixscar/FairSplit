import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

const ScrollIntro = ({ onComplete }) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [duration, setDuration] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Smoothing the scroll progress for a buttery feel
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 60,   // Slightly increased for better response
    damping: 25,     // Balanced damping
    restDelta: 0.001
  });

  // Zoom and Y move effect
  // We start the zoom a bit earlier (0.7) and finish near the end
  const scale = useTransform(smoothProgress, [0.7, 0.95], [1, 6]); 
  const yMove = useTransform(smoothProgress, [0.7, 0.95], [0, -100]);
  const opacity = useTransform(smoothProgress, [0.92, 1], [1, 0]);

  // Sync video time with scroll progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Force pause to ensure we control the playback via currentTime
    video.pause();

    let requestRef;
    const syncVideo = () => {
      // readyState 2 means HAVE_CURRENT_DATA (at least the current frame is available)
      if (video.readyState >= 2 && video.duration) {
        const progress = smoothProgress.get();
        
        // Map 0 -> 0.85 of scroll to 0 -> 100% of video duration
        // This ensures the video finishes BEFORE the final zoom ends
        const targetTime = Math.min(progress / 0.85, 1) * video.duration;
        
        // Optimization: only update if the difference is more than ~1 frame (at 30fps)
        // This prevents the browser from struggling with too many seek requests
        if (Math.abs(video.currentTime - targetTime) > 0.03) {
          video.currentTime = targetTime;
        }
      }
      requestRef = requestAnimationFrame(syncVideo);
    };

    requestRef = requestAnimationFrame(syncVideo);
    return () => cancelAnimationFrame(requestRef);
  }, [smoothProgress]);

  // Detect completion
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      if (latest >= 0.99) {
        onComplete();
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress, onComplete]);

  return (
    <div ref={containerRef} style={{ height: "450vh", background: "#070e17" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          width: "100%",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
        }}
      >
        <motion.div
          style={{
            position: "relative",
            width: "100vw", 
            height: "100vh", 
            display: "grid",
            placeItems: "center",
            scale: scale,
            y: yMove,
            opacity: opacity
          }}
        >
          <video
            ref={videoRef}
            src="/assets/anim/intro.mp4"
            muted
            playsInline
            preload="auto"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              pointerEvents: "none",
              clipPath: "inset(0 0 6% 0)" 
            }}
          />
        </motion.div>

      
        <motion.div
          style={{
            position: "absolute",
            bottom: "40px",
            color: "rgba(255,255,255,0.4)",
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.3em",
            opacity: useTransform(smoothProgress, [0, 0.05], [1, 0]),
          }}
        >
          Scrollez pour decouvrir
        </motion.div>
      </div>
    </div>
  );
};

export default ScrollIntro;
