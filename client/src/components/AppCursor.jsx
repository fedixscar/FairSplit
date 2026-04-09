import { useEffect } from "react";

export default function AppCursor() {
  useEffect(() => {
    const dot = document.querySelector(".app-cursor__dot");
    const ring = document.querySelector(".app-cursor__ring");
    if (!dot || !ring) return;

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;
    let rafId;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = `${mouseX}px`;
      dot.style.top = `${mouseY}px`;

      const clickable = e.target.closest(
        "a, button, input, label, [role='button'], select, textarea"
      );
      dot.classList.toggle("is-hovering", !!clickable);
      ring.classList.toggle("is-hovering", !!clickable);
    };

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;
      rafId = requestAnimationFrame(animateRing);
    };
    rafId = requestAnimationFrame(animateRing);

    const onDown = () => {
      dot.classList.add("is-clicking");
      ring.classList.add("is-clicking");
    };
    const onUp = () => {
      dot.classList.remove("is-clicking");
      ring.classList.remove("is-clicking");
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <>
      <div className="app-cursor__dot" />
      <div className="app-cursor__ring" />
    </>
  );
}
