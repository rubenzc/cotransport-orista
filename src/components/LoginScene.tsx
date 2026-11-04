/**
 * Ilustración de la pantalla de acceso: el coche con la hoja de la marca, circulando por una carretera
 * al pie del puig de Sant Sebastià, con su ermita de piedra (campanario cuadrado adosado, tejado de teja,
 * ojo de buey y puerta de madera) rodeada de pinos, y la plana de Osona detrás.
 *
 * Es decorativa (aria-hidden) y no tiene fondo propio: el cielo es el del tema. Los colores salen de las
 * variables `--ill-*` de styles.css, con valores distintos en claro y en oscuro (de día: sol; de noche:
 * luna, estrellas y ventanas encendidas). El paisaje se desvanece hacia abajo con una máscara SVG; el
 * coche queda fuera de la máscara para que no pierda nitidez.
 */
export default function LoginScene() {
  return (
    <div className="login-scene" aria-hidden="true">
      <svg viewBox="0 0 400 246" preserveAspectRatio="xMidYMax slice" focusable="false">
        <defs>
          <linearGradient id="il-fade-grad" gradientUnits="userSpaceOnUse" x1="0" y1="204" x2="0" y2="250">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <mask id="il-fade" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="260">
            <rect width="400" height="260" fill="url(#il-fade-grad)" />
          </mask>
        </defs>

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
          <circle cx="24" cy="78" r="1.2" className="il-star" />
          <circle cx="372" cy="104" r="1.4" className="il-star" />
          <circle cx="352" cy="40" r="1.5" className="il-star" />
          <circle cx="168" cy="84" r="1.1" className="il-star" />
        </g>
        <g className="il-cloud">
          <path d="M34 66h58a11 11 0 0 0 0-22 16 16 0 0 0-30-3 13 13 0 0 0-28 25Z" />
          <path transform="translate(196 -8)" d="M150 48h40a8 8 0 0 0 0-16 11 11 0 0 0-21-2 9 9 0 0 0-19 18Z" />
        </g>

        <g mask="url(#il-fade)">
          {/* montañas lejanas (Montseny, Cadí) y plana de Osona */}
          <path className="il-far" d="M0 150c28-22 52-12 76-26 22-13 36-30 62-22 22 7 30 22 52 18 26-5 34-30 62-32 24-2 30 20 52 22 24 3 34-10 56-6v156H0Z" />
          <path className="il-mid" d="M0 176c44-14 96-8 150-14s118-12 170-6c32 4 62 10 80 8v96H0Z" />
          <path className="il-field-a" d="M18 196l62-10 26 7-66 12Z" />
          <path className="il-field-b" d="M118 190l70-9 22 6-72 11Z" />
          <path className="il-field-a" d="M214 186l52-6 20 5-56 9Z" />
          <path className="il-mid2" d="M0 198c70-14 142-6 214-12s126-8 186-2v76H0Z" />
          <path className="il-field-b" d="M40 212l78-8 24 6-86 10Z" />

          {/* puig de Sant Sebastià */}
          <path className="il-near" d="M176 224c34-22 62-62 96-92 16-14 36-18 52-8 14 9 22 28 36 44 12 15 28 24 40 28v64H176Z" />
          <path className="il-near-shade" d="M296 124c14 8 22 26 34 40 12 16 28 26 42 30l28 14v-20c-14-5-28-14-40-28-14-16-22-35-36-44-8-5-18-6-28-2Z" />

          {/* ermita de piedra: nave con tejado a dos aguas y campanario cuadrado adosado con tejado piramidal.
              Proyección paralela: la profundidad de la nave se dibuja siempre con el mismo desplazamiento (28, 0),
              así que cumbrera y alero son paralelos y el borde lejano del tejado copia la inclinación del frontón.
              Todo apoya en la misma línea (y = 138). */}
          <rect className="il-stone-shade" x="305" y="114" width="28" height="24" />
          <path className="il-roof-shade" d="M291 101H319L337 115H309Z" />
          <rect className="il-stone" x="277" y="114" width="28" height="24" />
          <path className="il-roof" d="M273 115 291 101 309 115Z" />
          <rect className="il-roof-shade" x="273" y="114.2" width="36" height="2" />
          <circle className="il-window" cx="291" cy="120.5" r="2.3" />
          <rect className="il-stone-shade" x="285.4" y="125.6" width="9.2" height="2.2" />
          <rect className="il-door" x="287" y="127.8" width="6" height="10.2" />

          <rect className="il-stone" x="265" y="84" width="12" height="54" />
          <rect className="il-stone-shade" x="272.4" y="84" width="4.6" height="54" />
          <path className="il-roof" d="M262.6 85.5 271 74l8.4 11.5Z" />
          <path className="il-roof-shade" d="M271 74l8.4 11.5H271Z" />
          <path className="il-cross" d="M271 74V66M268 69h6" fill="none" strokeWidth="1.3" strokeLinecap="round" />
          <path className="il-window" d="M267.2 95.6v-3.4a1.6 1.6 0 0 1 3.2 0v3.4Z" />
          <path className="il-window" d="M272 95.6v-3.4a1.6 1.6 0 0 1 3.2 0v3.4Z" />

          {/* prado y carretera */}
          <g transform="translate(0 -26)">
            <path className="il-front" d="M0 226c56-12 124-6 196-10s150-8 204 0v44H0Z" />
            <path className="il-road" d="M0 240c92-10 204-4 400-12v14c-196 12-308 6-400 18Z" />
            <path className="il-road-line" d="M10 246c44-4 74-5 110-6l2 2c-36 1-64 3-108 8Zm148-8c40-1 74-2 104-3l1 2c-30 1-64 2-103 5Zm162-3c26-1 52-2 80-4l1 2c-28 2-54 3-79 5Z" />
          </g>
        </g>

        {/* coche con la hoja de la marca, algo a la izquierda del centro */}
        <g transform="translate(66 100) scale(0.26)">
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
