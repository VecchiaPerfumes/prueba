# VECCHIA PERFUMES

Tienda online estática: catálogo de 116 fragancias, carrito con persistencia,
favoritos, buscador, test «¿Qué perfume soy?» y cierre de pedido por WhatsApp.

Sin frameworks, sin dependencias y sin paso de compilación: se sube tal cual.

---

## Subir a GitHub

1. En tu repositorio: **Add file → Upload files**.
2. Arrastra **todo el contenido de esta carpeta**, incluida la carpeta `assets`
   entera (arrastra la carpeta, no los tres archivos sueltos).
3. Commit.

> ⚠️ Si subes `vecchia.css`, `app.js` y `data.js` sueltos en la raíz en vez de
> dentro de `assets/`, la web sale en blanco. La carpeta tiene que conservarse.

### Borra del repositorio estos archivos viejos

Ya no se usan y solo estorban:

```
site-components.css
site-footer.css
site-variables.css
```

### Estructura correcta

```
/
├── index.html              inicio
├── catalogo.html           catálogo con filtros y ordenación
├── producto.html           ficha de producto (?id=...)
├── favoritos.html
├── checkout.html
├── contacto.html
├── quiz.html               ¿Qué perfume soy?
├── robots.txt
├── sitemap.xml
├── README.md
├── LEEME.md                manual completo
├── mens-collection.html    ┐
├── woman-collection.html   │ redirecciones de las URLs antiguas
├── unisex-collection.html  │ (no las borres: mantienen vivos
├── gift-sets.html          │  los enlaces ya compartidos)
├── vecchia-quiz.html       │
├── catalog.html            ┘
└── assets/
    ├── vecchia.css         sistema de diseño
    ├── app.js              carrito, favoritos, buscador, tasa
    └── data.js             catálogo completo
```

## Publicar en Vercel

Es un sitio estático: no hay que configurar nada.

- Framework preset: **Other**
- Build command: *(vacío)*
- Output directory: *(vacío o `.`)*

El `vercel.json` incluido solo añade caché para `assets/`.

---

## Editar el catálogo

Todo vive en **`data.js`**. Cambias ahí y se actualiza en todas las
páginas a la vez: inicio, catálogo, buscador, ficha, favoritos y carrito.

```js
{
  "id": "asad-lattafa-100ml-edp",   // no lo cambies: es el enlace de la ficha
  "name": "Asad Lattafa 100ml EDP",
  "brand": "Lattafa",               // "" para no mostrar marca
  "price": 50,                      // número, sin símbolo
  "image": "https://…",
  "alt": "Asad Lattafa 100ml EDP",
  "desc": "…",
  "family": "arabes",               // "arabes" | "designer"
  "genders": ["hombre"],            // hombre | mujer | unisex | sets
  "soldOut": false,                 // true = AGOTADO, no se puede pedir
  "bestseller": false,              // sale en «Más vendidos»
  "nuevo": false,                   // sale en «Novedades»
  "dark": true                      // true si la foto trae fondo oscuro
}
```

## Tasa USD → Bs

Si al publicar no ves los precios en bolívares, abre `app.js`, busca
`manual:` dentro del bloque `Rate` y escribe el número:

```js
manual: 234.56,
```

Eso tiene prioridad sobre cualquier API y funciona siempre.
El detalle completo está en `LEEME.md`.

---

Contacto: [WhatsApp](https://wa.me/582735527411) · Barinas, Venezuela
