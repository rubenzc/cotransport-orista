/**
 * Ilustración de la pantalla de acceso: el coche con la hoja de la marca, circulando por una carretera
 * al pie del puig de Sant Sebastià (ermita y mirador) con la plana de Osona detrás.
 *
 * Es decorativa (aria-hidden) y no tiene fondo propio: el cielo es el del tema. Todos los colores salen de
 * las variables `--ill-*` de styles.css, que tienen valores distintos en claro y en oscuro
 * (de día: sol; de noche: luna y estrellas).
 */
export default function LoginScene() {
  return (
    <div className="login-scene" aria-hidden="true">
      <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMax slice" focusable="false">
        {/* cielo: sol de día, luna y estrellas de noche */}
        <g className="il-sun">
          <circle cx="226" cy="54" r="31" className="il-sun-halo" />
          <circle cx="226" cy="54" r="19" className="il-sun-disc" />
        </g>
        <g className="il-night">
          <circle cx="224" cy="52" r="18" className="il-moon" />
          <circle cx="233" cy="46" r="16" className="il-moon-shadow" />
          <circle cx="60" cy="34" r="1.6" className="il-star" />
          <circle cx="112" cy="58" r="1.2" className="il-star" />
          <circle cx="168" cy="26" r="1.8" className="il-star" />
          <circle cx="300" cy="62" r="1.2" className="il-star" />
          <circle cx="352" cy="40" r="1.5" className="il-star" />
          <circle cx="24" cy="78" r="1.2" className="il-star" />
          <circle cx="372" cy="104" r="1.4" className="il-star" />
          <circle cx="168" cy="84" r="1.1" className="il-star" />
        </g>
        <g className="il-cloud">
          <path d="M34 66h58a11 11 0 0 0 0-22 16 16 0 0 0-30-3 13 13 0 0 0-28 25Z" />
          <path transform="translate(196 -8)" d="M150 48h40a8 8 0 0 0 0-16 11 11 0 0 0-21-2 9 9 0 0 0-19 18Z" />
        </g>

        {/* montañas lejanas (Montseny, Cadí) y plana de Osona */}
        <path className="il-far" d="M0 150c28-22 52-12 76-26 22-13 36-30 62-22 22 7 30 22 52 18 26-5 34-30 62-32 24-2 30 20 52 22 24 3 34-10 56-6v156H0Z" />
        <path className="il-mid" d="M0 176c44-14 96-8 150-14s118-12 170-6c32 4 62 10 80 8v96H0Z" />
        <path className="il-field-a" d="M18 196l62-10 26 7-66 12Z" />
        <path className="il-field-b" d="M118 190l70-9 22 6-72 11Z" />
        <path className="il-field-a" d="M214 186l52-6 20 5-56 9Z" />
        <path className="il-mid2" d="M0 198c70-14 142-6 214-12s126-8 186-2v76H0Z" />
        <path className="il-field-b" d="M40 214l78-8 24 6-86 10Z" />

        {/* puig de Sant Sebastià con la ermita y el mirador */}
        <path className="il-near" d="M176 224c34-22 62-62 96-92 16-14 36-18 52-8 14 9 22 28 36 44 12 15 28 24 40 28v64H176Z" />
        <path className="il-near-shade" d="M296 124c14 8 22 26 34 40 12 16 28 26 42 30l28 14v-20c-14-5-28-14-40-28-14-16-22-35-36-44-8-5-18-6-28-2Z" />

        <g className="il-tree">
          <ellipse cx="238" cy="158" rx="6" ry="13" />
          <ellipse cx="250" cy="166" rx="5" ry="11" />
          <ellipse cx="354" cy="158" rx="5" ry="11" />
          <ellipse cx="366" cy="170" rx="6" ry="12" />
        </g>

        {/* ermita: nave única, ábside cuadrado, tejado a dos aguas */}
        <rect className="il-stone" x="268" y="110" width="32" height="22" />
        <rect className="il-stone-shade" x="300" y="116" width="9" height="16" />
        <path className="il-roof" d="M264 111 284 96l20 15Z" />
        <path className="il-roof-shade" d="M300 117l5-4 5 4Z" />
        <rect className="il-door" x="281" y="121" width="7" height="11" rx="3.5" />
        <rect className="il-window" x="272" y="116" width="3" height="5" rx="1.5" />

        {/* mirador: torre de piedra con plataforma almenada */}
        <rect className="il-stone" x="316" y="96" width="18" height="44" />
        <rect className="il-stone-shade" x="327" y="96" width="7" height="44" />
        <rect className="il-stone" x="312" y="90" width="26" height="7" />
        <g className="il-stone">
          <rect x="312" y="84" width="5" height="7" />
          <rect x="321" y="84" width="5" height="7" />
          <rect x="330" y="84" width="5" height="7" />
        </g>
        <rect className="il-window" x="323" y="106" width="3.2" height="9" rx="1.6" />
        <rect className="il-window" x="323" y="122" width="3.2" height="9" rx="1.6" />

        {/* prado y carretera */}
        <path className="il-front" d="M0 226c56-12 124-6 196-10s150-8 204 0v44H0Z" />
        <path className="il-road" d="M0 240c92-10 204-4 400-12v14c-196 12-308 6-400 18Z" />
        <path className="il-road-line" d="M10 246c44-4 74-5 110-6l2 2c-36 1-64 3-108 8Zm148-8c40-1 74-2 104-3l1 2c-30 1-64 2-103 5Zm162-3c26-1 52-2 80-4l1 2c-28 2-54 3-79 5Z" />

        {/* coche con la hoja de la marca */}
        <g transform="translate(16 124) scale(0.26)">
          <path className="il-leaf" d="M236 206C206 128 248 66 340 54C356 138 318 206 236 206Z" />
          <path className="il-leaf-vein" d="M238 204C268 150 300 108 332 66" fill="none" strokeWidth="9" strokeLinecap="round" />
          <path className="il-car" d="M146 300L186 226C194 212 206 206 222 206H300C316 206 328 212 338 226L378 300Z" />
          <rect className="il-car" x="86" y="290" width="340" height="100" rx="42" />
          <path className="il-win" d="M180 290L204 240H244V290Z" />
          <path className="il-win" d="M264 240H298C304 240 308 243 312 248L338 290H264Z" />
          <circle className="il-tire" cx="176" cy="392" r="52" />
          <circle className="il-car" cx="176" cy="392" r="40" />
          <circle className="il-win" cx="176" cy="392" r="15" />
          <circle className="il-tire" cx="338" cy="392" r="52" />
          <circle className="il-car" cx="338" cy="392" r="40" />
          <circle className="il-win" cx="338" cy="392" r="15" />
        </g>
      </svg>
    </div>
  );
}
