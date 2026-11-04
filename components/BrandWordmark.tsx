/** A warm, character-led spark that remains legible from favicon to wordmark. */
export default function BrandWordmark() {
  return (
    <span className="wordmark citylit-logo" role="img" aria-label="Citylit">
      <svg className="citylit-logo-symbol" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <rect x="1" y="1" width="38" height="38" rx="13" fill="#17243C" />
        <path
          d="M20 5.2c3.6 0 5.1 4.8 6.4 8.4 3.6 1.3 8.4 2.8 8.4 6.4s-4.8 5.1-8.4 6.4c-1.3 3.6-2.8 8.4-6.4 8.4s-5.1-4.8-6.4-8.4c-3.6-1.3-8.4-2.8-8.4-6.4s4.8-5.1 8.4-6.4C14.9 10 16.4 5.2 20 5.2Z"
          fill="#B39AFF"
        />
        <path
          d="M20 5.2c3.6 0 5.1 4.8 6.4 8.4 3.6 1.3 8.4 2.8 8.4 6.4s-4.8 5.1-8.4 6.4c-1.3 3.6-2.8 8.4-6.4 8.4 2.7-7.8 1.8-23.3 0-30.6Z"
          fill="#8E77EA"
          opacity=".8"
        />
        <rect x="14.9" y="16" width="3.7" height="7.7" rx="1.85" fill="#17243C" />
        <rect x="21.5" y="16" width="3.7" height="7.7" rx="1.85" fill="#17243C" />
        <path
          d="m18 27 2 1.5 2-1.5"
          fill="none"
          stroke="#17243C"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="11.3" cy="12.7" r="2.1" fill="#FFE09A" />
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
