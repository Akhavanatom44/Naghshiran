const CONTOURS = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='420' viewBox='0 0 420 420'%3E%3Cg fill='none' stroke='%2367e8f9' stroke-opacity='0.055' stroke-width='1.2'%3E%3Cpath d='M0 60c60-20 120 20 180 0s120-20 180 0 60 20 60 20'/%3E%3Cpath d='M0 140c70-30 130 30 200 0s140-30 220 0'/%3E%3Cpath d='M0 230c60 30 140-30 210 0s140 30 210 0'/%3E%3Cpath d='M0 320c80-30 140 30 210 10s140-20 210-10'/%3E%3Ccircle cx='300' cy='90' r='40'/%3E%3Ccircle cx='300' cy='90' r='62'/%3E%3Ccircle cx='300' cy='90' r='84'/%3E%3Ccircle cx='90' cy='300' r='34'/%3E%3Ccircle cx='90' cy='300' r='56'/%3E%3C/g%3E%3C/svg%3E")`;

export default function GlowBackground() {
  return (
    <div aria-hidden="true" className="site-lighting pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="blueprint-grid absolute inset-0" />
      <div className="absolute inset-0" style={{ backgroundImage: CONTOURS }} />
    </div>
  );
}
