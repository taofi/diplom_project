# План исправления ProductForm для режима редактирования

## Проблемы, выявленные пользователем:

### 1. Лицензии не отображаются при редактировании
**Причина**: Инициализация лицензий из product.licenses происходит в useEffect, который срабатывает ДО загрузки licenseTypes. В результате данные есть, но отображаться не могут, т.к. licenseTypes пустой.

### 2. Новые изображения должны перемещаться из temp папки
**Причина**: При редактировании нужно отправлять данные в том же формате, что и при создании - через tempMediaUrls. Новые изображения должны быть помечены как `isNew: true`.

### 3. Нужна отладка для обновления
**Причина**: Для диагностики проблем нужно добавить console.log при отправке формы.

---

## План исправлений:

### 1. Исправить порядок инициализации данных при редактировании

**Проблема**: При редактировании данные product загружаются асинхронно, а licenseTypes тоже асинхронно. Нужно гарантировать, что licenseTypes загружены перед инициализацией licenses.

**Решение**: 
- Добавить флаг `dataInitialized` для отслеживания, что данные продукта были загружены
- Добавить проверку на наличие licenseTypes перед инициализацией licenses

```typescript
// Инициализация данных продукта
useEffect(() => {
  if (isEditMode && product) {
    // ... инициализация основных полей
    
    // Инициализируем медиа с флагом isNew: false для существующих
    if (product.media && product.media.length > 0) {
      setMedia(product.media.map(m => ({
        url: m.url,
        isCover: m.isCover,
        isNew: false,  // это существующие медиа
      })));
    }
  }
}, [isEditMode, product]);

// Отдельный эффект для инициализации licenses после загрузки licenseTypes
useEffect(() => {
  if (!fetchingData && licenseTypes.length > 0) {
    if (isEditMode && product?.licenses) {
      // Инициализируем licenses когда licenseTypes уже загружены
      setLicenses(product.licenses.map(l => ({
        id: l.id.toString(),
        licenseTypeId: l.licenseTypeId,
        price: l.price.toString(),
      })));
    } else if (!isEditMode && licenses.length === 0) {
      // Для нового продукта - создать пустую лицензию
      setLicenses([{
        id: '1',
        licenseTypeId: licenseTypes[0].id,
        price: '',
      }]);
    }
  }
}, [fetchingData, licenseTypes, isEditMode, product]);
```

### 2. Исправить обработку медиа при редактировании

**Логика**:
- Все существующие медиа (загруженные ранее) имеют `isNew: false`
- Новые добавленные медиа имеют `isNew: true`
- При отправке формы: отправляем только новые медиа в tempMediaUrls

**Решение** - в handleSubmit:
```typescript
// Медиа - только новые (isNew: true)
const newMedia = media.filter(m => m.isNew);
const tempMediaUrls = newMedia.length > 0 
  ? newMedia.map(m => ({ url: m.url, isCover: m.isCover })) 
  : undefined;
```

### 3. Добавить отладку

**Добавить в handleSubmit:**
```typescript
console.log('[FRONT DEBUG] Submit product data:', JSON.stringify({
  mode: isEditMode ? 'update' : 'create',
  data: productData,
}, null, 2));
```

### 4. Также нужно проверить работу с fileUrl (основной файл продукта)

При редактировании нужно отправлять новый файл в tempFileUrl.

---

## Файлы для изменения:

1. **front/src/components/admin/ProductForm.tsx**
   - Разделить эффекты инициализации
   - Исправить порядок загрузки licenseTypes для licenses
   - Добавить отладку
   - Исправить логику tempMediaUrls

2. **front/src/app/[lang]/admin/products/[id]/page.tsx**
   - Добавить отладку при загрузке продукта

---

## Ожидаемый результат:

1. ✅ При редактировании отображаются все существующие лицензии с их типами и ценами
2. ✅ Новые изображения корректно помечаются и отправляются на сервер
3. ✅ Console.log отладки показывает данные при отправке
4. ✅ Форма работает одинаково для create и edit режимов
