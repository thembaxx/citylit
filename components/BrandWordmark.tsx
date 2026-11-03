/** Citylit's compass-spark logo: a place marker and Khwezi's luminous diamond. */
export default function BrandWordmark() {
  return (
    <span className="wordmark citylit-logo" role="img" aria-label="citylit">
      <svg className="citylit-logo-symbol" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <rect x="1" y="1" width="38" height="38" rx="13" fill="#17243C" />
        <path d="M20 5 24.6 15.4 35 20 24.6 24.6 20 35 15.4 24.6 5 20 15.4 15.4Z" fill="#F3C975" />
        <path d="M20 11.5 23.1 20 20 28.5 16.9 20Z" fill="#6558F5" />
        <circle cx="20" cy="20" r="3.2" fill="#FFF8E8" />
      </svg>
      <span className="wordmark-letters" aria-hidden="true">
        c
        <span className="wordmark-i">
          ı<span className="wordmark-spark" />
        </span>
        tylit
      </span>
    </span>
  );
}
