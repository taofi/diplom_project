# План создания страницы просмотра товара (Product Page)

## Анализ текущей структуры проекта

### Что УЖЕ ЕСТЬ:

#### API:
- [`getProductById(id, language)`](front/src/lib/api-product.ts:103) - получить товар по ID
- [`getProductMedia(productId)`](front/src/lib/api-product.ts:178) - получить медиа товара
- [`getProductLicenses(productId)`](front/src/lib/api-product.ts:187) - получить лицензии товара

#### Типы:
- [`ProductResponse`](front/src/types/product/product-relations.types.ts:100) - структура товара:
  - id, name, description, price, discountPrice
  - type (brush | illustration)
  - mainImage, fileUrl
  - seller (продавец)
  - categories
  - translations
  - media (изображения/видео)
  - licenses

#### Компоненты:
- [`ProductCard`](front/src/components/ProductCard.tsx) - карточка товара (нужно добавить ссылку)
- UI компоненты: Button, Card, Input, Select, etc.

---

## ЧТО НУЖНО СОЗДАТЬ

### Этап 1: Обновить ProductCard - добавить ссылку

#### 1.1 Добавить Link из next/link
Файл: [`front/src/components/ProductCard.tsx`](front/src/components/ProductCard.tsx)

```tsx
import Link from 'next/link';
import { useI18n } from '@/context/i18n/I18nContext';

// Обернуть карточку в Link
<Link href={`/${locale}/product/${product.id}`}>
  <div className="rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow bg-white">
    {/* ... */}
  </div>
</Link>
```

---

### Этап 2: Создать страницу товара

#### 2.1 Создать страницу товара
Файл: [`front/src/app/[lang]/product/[id]/page.tsx`](front/src/app/[lang]/product/[id]/page.tsx)

Структура страницы:

```
┌─────────────────────────────────────────────────────────────┐
│ Header (шапка сайта)                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Заголовок товара                              Метаданные   │
│  ─────────────────────────────────────────     ─────────── │
│  Название крупным шрифтом                   Автор/студия    │
│  (слева сверху)                             Featured       │
│                                                             │
├────────────────────────────────┬────────────────────────────┤
│                                │                            │
│  Галерея изображений            │  Сайдбар оформления        │
│  ┌────┐ ┌──────────────┐      │  ┌────────────────────┐    │
│  │    │ │              │      │  │                    │    │
│  │ 🖼 │ │   Главное    │      │  │   $99.00          │    │
│  │    │ │   изображение│      │  │   [Выбор лицензии]│    │
│  │    │ │              │      │  │                    │    │
│  ├────┤ │              │      │  │ [Add to cart]     │    │
│  │    │ │              │      │  │ [Buy now]         │    │
│  │ 🖼 │ │              │      │  │                    │    │
│  │    │ └──────────────┘      │  └────────────────────┘    │
│  ├────┤                         │                            │
│  │ 🖼 │                         │  Описание товара           │
│  └────┘                         │  (под кнопками)           │
│                                │                            │
└────────────────────────────────┴────────────────────────────┘
```

##### Компоненты страницы:

1. **Заголовок (Header Section)**
   - Название товара (крупный шрифт, слева)
   - Тег автора/студии (ссылка на профиль)
   - Статус "Featured" (если isFeatured = true)

2. **Галерея (Gallery Section) - Левая колонка (2/3)**
   - Вертикальная полоса миниатюр (thumbnails) слева
   - Главное превью по центру
   - Клик по миниатюре меняет главное изображение
   - Поддержка видео (thumbnail с иконкой play)

3. **Сайдбар (Sidebar Section) - Правая колонка (1/3)**
   - Зафиксирован при скролле (sticky)
   - Цена (крупная)
   - Выбор лицензии (select/radio buttons)
   - Кнопки действий:
     - "Add to cart" (добавить в корзину)
     - "Buy now" (купить сейчас)
   - Описание товара (под кнопками)

---

### Этап 3: Компоненты страницы товара

#### 3.1 Создать компонент Gallery
Файл: [`front/src/components/product/Gallery.tsx`](front/src/components/product/Gallery.tsx)

```tsx
interface GalleryProps {
  media: MediaInfo[];
  productName: string;
}

export function Gallery({ media, productName }: GalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Filter только изображения (не видео)
  const images = media.filter(m => m.mediaType === 'image');
  
  return (
    <div className="flex gap-4">
      {/* Thumbnails - вертикальная полоса */}
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px]">
        {images.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setSelectedIndex(index)}
            className={`w-16 h-16 rounded overflow-hidden border-2 ${
              index === selectedIndex ? 'border-primary' : 'border-transparent'
            }`}
          >
            <ServerImage src={item.url} alt={productName} fill className="object-cover" />
          </button>
        ))}
      </div>
      
      {/* Main Preview */}
      <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden">
        <ServerImage 
          src={images[selectedIndex]?.url} 
          alt={productName} 
          fill 
          className="object-contain" 
        />
      </div>
    </div>
  );
}
```

#### 3.2 Создать компонент ProductSidebar
Файл: [`front/src/components/product/ProductSidebar.tsx`](front/src/components/product/ProductSidebar.tsx)

```tsx
interface ProductSidebarProps {
  price: number;
  discountPrice?: number | null;
  licenses: LicenseInfo[];
  selectedLicense: LicenseInfo | null;
  onLicenseChange: (license: LicenseInfo) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
}

export function ProductSidebar({ ... }: ProductSidebarProps) {
  // Вычисление отображаемой цены
  const displayPrice = discountPrice ?? price;
  
  return (
    <div className="sticky top-4">
      {/* Цена */}
      <div className="text-3xl font-bold mb-4">
        ${displayPrice.toFixed(2)}
      </div>
      
      {/* Выбор лицензии */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Выберите лицензию</label>
        {licenses.map(license => (
          <div key={license.id} className="flex items-center gap-2 mb-2">
            <input 
              type="radio" 
              name="license" 
              checked={selectedLicense?.id === license.id}
              onChange={() => onLicenseChange(license)}
            />
            <span>{license.licenseType?.name}</span>
            <span className="font-bold">${license.price}</span>
          </div>
        ))}
      </div>
      
      {/* Кнопки */}
      <div className="flex gap-2 mb-4">
        <Button onClick={onAddToCart} variant="outline" className="flex-1">
          Add to cart
        </Button>
        <Button onClick={onBuyNow} className="flex-1">
          Buy now
        </Button>
      </div>
    </div>
  );
}
```

#### 3.3 Создать компонент ProductInfo
Файл: [`front/src/components/product/ProductInfo.tsx`](front/src/components/product/ProductInfo.tsx)

```tsx
interface ProductInfoProps {
  name: string;
  description: string | null;
  seller?: SellerInfo;
  isFeatured: boolean;
  categories?: CategoryInfo[];
}

export function ProductInfo({ ... }: ProductInfoProps) {
  return (
    <div>
      {/* Заголовок и метаданные */}
      <h1 className="text-3xl font-bold mb-2">{name}</h1>
      
      <div className="flex items-center gap-4 mb-4">
        {seller && (
          <Link href={`/author/${seller.id}`} className="text-primary hover:underline">
            {seller.username}
          </Link>
        )}
        {isFeatured && (
          <span className="bg-yellow-400 text-white px-2 py-1 rounded text-sm">
            Featured
          </span>
        )}
      </div>
      
      {/* Категории */}
      {categories && categories.length > 0 && (
        <div className="flex gap-2 mb-4">
          {categories.map(cat => (
            <Link 
              key={cat.id} 
              href={`/catalog?category=${cat.id}`}
              className="bg-gray-200 px-2 py-1 rounded text-sm hover:bg-gray-300"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}
      
      {/* Описание */}
      {description && (
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: description }} 
        />
      )}
    </div>
  );
}
```

---

### Этап 4: Логика страницы

#### 4.1 State управления

```tsx
// State
const [product, setProduct] = useState<ProductResponse | null>(null);
const [selectedLicense, setSelectedLicense] = useState<LicenseInfo | null>(null);
const [selectedImage, setSelectedImage] = useState(0);
const [loading, setLoading] = useState(true);

// Загрузка товара
useEffect(() => {
  async function loadProduct() {
    const data = await getProductById(productId, locale);
    setProduct(data);
    
    // Выбрать первую лицензию по умолчанию
    if (data.licenses && data.licenses.length > 0) {
      setSelectedLicense(data.licenses[0]);
    }
  }
  loadProduct();
}, [productId, locale]);

// Обработчики кнопок
const handleAddToCart = async () => {
  // Добавить в корзину с выбранной лицензией
  await addToCart(productId, selectedLicense.id);
};

const handleBuyNow = async () => {
  // Добавить в корзину и перейти к оформлению
  await addToCart(productId, selectedLicense.id);
  router.push(`/${locale}/checkout`);
};
```

---

### Этап 5: Добавить API для корзины (если нет)

#### 5.1 Проверить существующий Cart API
- Посмотреть [`server/src/cart/`](server/src/cart/)

#### 5.2 Создать addToCart на фронте
Файл: [`front/src/lib/api-cart.ts`](front/src/lib/api-cart.ts)

```typescript
interface AddToCartDto {
  productId: number;
  licenseTypeId: number;
  quantity?: number;
}

export async function addToCart(data: AddToCartDto): Promise<void> {
  await api.post('/cart', data);
}
```

---

### Этап 6: Обновить роутинг

#### 6.1 Убедиться что маршрут существует
- Проверить [`front/src/app/[lang]/`](front/src/app/[lang]/)
- Создать папку [`product/[id]`](front/src/app/[lang]/product/[id])

---

## Чеклист реализации

### Фронтенд:
- [ ] Обновить ProductCard - добавить ссылку на страницу товара
- [ ] Создать страницу [`front/src/app/[lang]/product/[id]/page.tsx`](front/src/app/[lang]/product/[id]/page.tsx)
- [ ] Создать компонент Gallery
- [ ] Создать компонент ProductSidebar
- [ ] Создать компонент ProductInfo
- [ ] Реализовать выбор лицензии
- [ ] Реализовать кнопки Add to Cart / Buy Now
- [ ] Добавить API для корзины (если нужно)
- [ ] Добавить переводы

### Бэкенд (если нужно):
- [ ] Проверить/создать Cart API endpoints
- [ ] Добавить endpoint для добавления в корзину с licenseTypeId

---

## Технические детали

### Layout страницы:
```tsx
<div className="max-w-7xl mx-auto px-6 py-8 mt-20">
  {/* Заголовок */}
  <ProductInfo {...} />
  
  {/* Контент */}
  <div className="flex gap-8 mt-8">
    {/* Галерея - 2/3 */}
    <div className="w-2/3">
      <Gallery {...} />
    </div>
    
    {/* Сайдбар - 1/3 */}
    <div className="w-1/3">
      <ProductSidebar {...} />
      
      {/* Описание под кнопками */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Описание</h2>
        <div dangerouslySetInnerHTML={{ __html: description }} />
      </div>
    </div>
  </div>
</div>
```

### Типы для компонентов:
```typescript
// MediaInfo уже определён в product-relations.types.ts
// LicenseInfo уже определён

interface SelectedLicenseState {
  licenseId: number;
  price: number;
}
```

### Debounce для миниатюр не нужен - просто клик

### Адаптивность:
- Desktop: 2/3 + 1/3 колонки
- Tablet: галерея сверху, сайдбар снизу
- Mobile: всё вертикально
