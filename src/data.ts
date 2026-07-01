import { Product, Review } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "dante-01",
    name: "Cama Anti-Estrés Dante Nube Premium",
    category: "Favoritos de Dante",
    description: "La cama favorita de Dante para sus siestas infinitas. Diseñada con felpa vegana de pelo largo ultra suave y bordes elevados que alivian la ansiedad, proporcionando el soporte ortopédico ideal para un descanso reparador y feliz.",
    price: 99000,
    compareAtPrice: 159000,
    imageUrl: "https://images.unsplash.com/photo-1541599540903-216a46ca1ad0?auto=format&fit=crop&q=80&w=600",
    badge: "Elección de Dante",
    features: [
      "Felpa premium de 4cm de longitud, ultra mullida",
      "Borde elevado que simula el abrazo de la mamá de Dante",
      "Base impermeable y antideslizante para evitar accidentes",
      "Fácil de lavar a máquina en ciclo suave",
      "Relleno de fibra de algodón PP ecológica de alta densidad"
    ],
    specs: {
      "Material": "Felpa Vegana + Algodón Orgánico",
      "Tamaños disponibles": "M (60cm) / L (80cm) / XL (100cm)",
      "Recomendado para": "Perros y gatos ansiosos de todo tamaño",
      "Soporte": "Ortopédico articulaciones",
      "Lavado": "Apto para lavadora y secadora"
    },
    dropiCost: 35000,
    rating: 5.0,
    reviewsCount: 184
  },
  {
    id: "dante-02",
    name: "Cepillo de Vapor Dante Spa Multiusos",
    category: "Cuidado Higiene",
    description: "¡Basta de pelos por toda la casa! Este revolucionario cepillo utiliza vapor de agua ultrasónico para desinfectar, suavizar y retirar hasta el 95% del pelo muerto mientras le das un reconfortante masaje relajante a tu mascota.",
    price: 69000,
    compareAtPrice: 119000,
    imageUrl: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=600",
    badge: "¡Lo Más Vendido!",
    features: [
      "Vaporización fría ultra-fina 100% segura para mascotas",
      "Cerdas suaves de silicona médica que no lastiman la piel",
      "Carga rápida USB con batería de alta autonomía",
      "Elimina nudos rebeldes y reduce el olor corporal al instante",
      "Tanque recargable para agua o esencias naturales de aseo"
    ],
    specs: {
      "Batería": "Recargable vía USB-C",
      "Material Cerdas": "Silicona suave hipoalergénica",
      "Tiempo de Carga": "1.5 Horas",
      "Capacidad de Tanque": "20 ml",
      "Garantía": "6 meses por defectos de fábrica"
    },
    dropiCost: 22000,
    rating: 4.9,
    reviewsCount: 128
  },
  {
    id: "dante-03",
    name: "Dispensador de Premios Dante Smart-Ball",
    category: "Juguetes & Mente",
    description: "El juguete interactivo definitivo que mantiene la mente de tu consentido estimulada. Al rodar va soltando croquetas lentamente, lo que ayuda a combatir el aburrimiento, la ansiedad por separación y previene que coman muy rápido.",
    price: 54000,
    compareAtPrice: 89000,
    imageUrl: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=600",
    badge: "Diversión Garantizada",
    features: [
      "Dificultad ajustable para entrenar el coeficiente mental",
      "Material ABS no tóxico de alta resistencia alimentaria",
      "Diseño en forma de laberinto interno para retardar la ingesta",
      "Desarmable en 3 piezas para un lavado impecable en segundos",
      "Apto para premios y alimento seco de cualquier tamaño"
    ],
    specs: {
      "Material": "ABS de Grado Alimenticio Libre de BPA",
      "Peso": "270g súper resistente a mordidas",
      "Dimensiones": "10cm x 12cm",
      "Color": "Amarillo Golden Alegre",
      "Nivel de dificultad": "Ajustable (Fácil a Avanzado)"
    },
    dropiCost: 15000,
    rating: 4.8,
    reviewsCount: 95
  },
  {
    id: "dante-04",
    name: "Bebedero de Cascada Dante Aqua-Pur",
    category: "Hogar",
    description: "Mantén a tu peludo perfectamente hidratado y saludable. Este bebedero automático de fuente continua con triple filtro de carbón activo atrae naturalmente a las mascotas a beber más agua, previniendo problemas renales.",
    price: 119000,
    compareAtPrice: 189000,
    imageUrl: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600",
    badge: "Salud Premium",
    features: [
      "Motor ultrasilencioso de 5V y ultra bajo consumo",
      "Sistema de filtración de 3 capas: carbón, resina y esponja",
      "Capacidad de 2.4 litros ideal para ausencias cortas",
      "Luz LED azul nocturna para ubicar la fuente en la oscuridad",
      "Fabricado en resina PP antibacterial libre de BPA"
    ],
    specs: {
      "Capacidad": "2.4 Litros continuos",
      "Alimentación": "Cable USB (Adaptador no incluido)",
      "Nivel de Ruido": "Menor a 30 dB (silencio absoluto)",
      "Sistema de Filtro": "Carbón activado de coco de alta densidad",
      "Garantía": "12 meses con Dante Store"
    },
    dropiCost: 45000,
    rating: 4.9,
    reviewsCount: 156
  },
  {
    id: "dante-05",
    name: "Arnés Ergonómico Dante No-Pull Reflectivo",
    category: "Paseo Seguro",
    description: "Disfruta de paseos tranquilos y sin jalones. El arnés diseñado especialmente para evitar la presión en el cuello de tu mascota, distribuyendo la fuerza de tracción uniformemente por el pecho con bandas altamente reflectivas de alta seguridad nocturna.",
    price: 75000,
    compareAtPrice: 129000,
    imageUrl: "https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&q=80&w=600",
    badge: "Seguridad Máxima",
    features: [
      "Doble anillo de aleación metálica para enganche delantero y trasero",
      "Costuras de nylon balístico de alta densidad con líneas de alta visibilidad 3M",
      "Forro de malla acolchada transpirable que evita irritación de piel",
      "Broches de seguridad rápidos con bloqueo de pestillo",
      "Manija trasera de control directo para emergencias"
    ],
    specs: {
      "Material": "Nylon Oxford 1000D + Malla acolchada",
      "Ajustabilidad": "4 puntos de regulación personalizados",
      "Reflectividad": "Tecnología 3M Scotchlite",
      "Tallas": "S, M, L, XL (con tabla de peso)",
      "Resistencia broches": "Hasta 200kg de fuerza de jalón"
    },
    dropiCost: 26000,
    rating: 4.9,
    reviewsCount: 210
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: "rev-01",
    author: "María José Beltrán",
    rating: 5,
    date: "Ayer",
    comment: "La cama Nube es lo máximo. Mi cachorro Golden de 4 meses se la pasa durmiendo ahí, es extremadamente suave y se siente muy acolchada. ¡Y el detalle del perrito Dante en la caja me encantó! Gran servicio de envío contra entrega.",
    verified: true,
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "rev-02",
    author: "Andrés Felipe Ortiz",
    rating: 5,
    date: "Hace 4 días",
    comment: "El cepillo de vapor ultrasónico superó mis expectativas. Elimina muchísimo pelo suelto y el vapor frío calma mucho a mi perro. El envío a Medellín fue súper rápido y pagué en efectivo en mi puerta.",
    verified: true,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "rev-03",
    author: "Clara Inés Gómez",
    rating: 5,
    date: "Hace 1 semana",
    comment: "Compré el arnés No-Pull y el bebedero Aqua-Pur. Mi perro ya no jala en los paseos y le encanta beber de la fuentecita de agua. Se nota la familiaridad, la presentación de la tienda es hermosa y muy confiable.",
    verified: true,
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120"
  }
];

export const SHOPIFY_LIQUID_CODE = `{% comment %}
  LA TIENDA DE DANTE - Sección de Historia Familiar del Perrito Dante (Shopify OS 2.0)
  Este bloque te permite tener un banner interactivo hermoso donde Dante el cachorro cuenta su historia.
  Guardar este archivo como 'sections/dante-puppy-story.liquid' en tu Shopify.
{% endcomment %}

<div class="dante-puppy-story-section" style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); color: #1e293b; padding: 60px 20px; font-family: 'Inter', sans-serif; border-radius: 20px; margin: 30px auto; max-width: 1200px; box-shadow: 0 10px 30px rgba(245, 158, 11, 0.15);">
  <div style="display: grid; grid-template-columns: 1fr; md:grid-template-columns: 1fr 1.2fr; gap: 40px; align-items: center; max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; md:flex-row;">
    
    <!-- Imagen del pequeño Dante -->
    <div style="flex: 1; text-align: center; position: relative;">
      <div style="background-color: #fbbf24; border-radius: 50%; width: 260px; height: 260px; margin: 0 auto; overflow: hidden; border: 8px solid #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        <img src="{{ section.settings.dante_image | img_url: '400x400' | default: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=400' }}" alt="Dante" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div style="position: absolute; bottom: 10px; right: 20%; background: #fbbf24; color: #000; font-size: 11px; font-weight: 900; padding: 4px 12px; border-radius: 99px; text-transform: uppercase; border: 2px solid #fff;">
        🐾 ¡Guau, Hola!
      </div>
    </div>

    <!-- Historia narrada por Dante -->
    <div style="flex: 1.5; text-align: left;">
      <span style="color: #d97706; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">
        {{ section.settings.subtitle }}
      </span>
      <h2 style="font-size: 32px; font-weight: 800; color: #1e293b; margin-top: 0; margin-bottom: 16px; line-height: 1.2;">
        {{ section.settings.title }}
      </h2>
      
      <p style="font-size: 15px; line-height: 1.7; color: #475569; margin-bottom: 20px; font-style: italic; background: #ffffff; padding: 15px 20px; border-left: 4px solid #fbbf24; border-radius: 0 12px 12px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
        "{{ section.settings.story_text }}"
      </p>

      <div style="display: flex; gap: 15px; flex-wrap: wrap;">
        <a href="{{ section.settings.cta_link }}" style="background-color: #d97706; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-size: 13px; font-weight: 700; text-transform: uppercase; tracking: 0.5px; display: inline-block; transition: all 0.3s ease; box-shadow: 0 4px 14px rgba(217,119,6,0.2);">
          {{ section.settings.cta_text }} 🐾
        </a>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">⭐</span>
          <span style="font-size: 13px; color: #475569; font-weight: 600;">Aprobado por Dante la mascota oficial</span>
        </div>
      </div>
    </div>

  </div>
</div>

{% schema %}
{
  "name": "Dante Puppy Story",
  "settings": [
    {
      "type": "text",
      "id": "subtitle",
      "label": "Subtítulo",
      "default": "CONOCE AL FUNDADOR DE LA TIENDA"
    },
    {
      "type": "text",
      "id": "title",
      "label": "Título",
      "default": "¡Hola! Soy Dante el Golden"
    },
    {
      "type": "textarea",
      "id": "story_text",
      "label": "Historia del cachorro",
      "default": "Tengo apenas unos meses de edad y me encanta correr por toda la casa. El humano que me cuida creó esta tienda para compartir con todo el mundo los productos más cómodos y seguros que yo mismo apruebo para mis siestas y juegos. ¡Queremos darte el servicio más familiar y feliz del mundo!"
    },
    {
      "type": "image_picker",
      "id": "dante_image",
      "label": "Foto del Perrito Dante"
    },
    {
      "type": "text",
      "id": "cta_text",
      "label": "Texto del Botón",
      "default": "Ver mis favoritos"
    },
    {
      "type": "url",
      "id": "cta_link",
      "label": "Enlace del Botón"
    }
  ],
  "presets": [
    {
      "name": "Dante Puppy Story",
      "category": "Promotional"
    }
  ]
}
{% endschema %}`;

export const DROPI_INTEGRATION_STEPS = [
  {
    step: 1,
    title: "Vincular Shopify con Dropi",
    description: "Ingresa a tu panel de Dropi (dropi.co), dirígete a la sección de 'Integraciones', selecciona 'Shopify' e ingresa la URL de tu tienda (.myshopify.com) para autorizar la sincronización automática de pedidos."
  },
  {
    step: 2,
    title: "Importar Productos Destacados de Dante",
    description: "Busca los productos de mascotas o artículos recomendados en el inventario masivo de Dropi ingresando las palabras clave o el SKU asociado. Agrégalos a tu 'Lista de Importación' y asígnales los precios de venta competitivos que Dante ha pre-diseñado para asegurar un margen saludable (ej. costando $35,000 en Dropi y vendiéndose en $99,000)."
  },
  {
    step: 3,
    title: "Configurar el Checkout Contra Entrega",
    description: "El contra entrega es el rey en LATAM. Instala una aplicación de checkout rápido en tu Shopify (como Reon o Relentless) para capturar los datos del cliente en un solo formulario y enviarlos automáticamente a la API de Dropi sin fricciones."
  },
  {
    step: 4,
    title: "Cumplimiento y Despacho Automatizado",
    description: "Una vez que ingresa un pedido por esta landing page en Shopify, Dropi lo lee automáticamente, genera la guía con la transportadora de tu elección (Envía, Servientrega, Coordinadora, Interrapidísimo) y despacha directamente al cliente."
  }
];
