# Frontend UI Component Architecture Plan

## 1. Current Component Structure Analysis

### 1.1 Navigation Components (Already Separate - KEEP AS IS)
Location: `front/src/components/`

| Component | File | Purpose |
|-----------|------|---------|
| Header | Header.tsx | Main header container |
| Navigation | Navigation.tsx | Navigation menu wrapper |
| NavButton | NavButton.tsx | Navigation link button with icon/badge support |
| Logo | Logo.tsx | Brand logo |
| LanguageSwitcher | LanguageSwitcher.tsx | Language toggle (RU/EN) |
| UserActions | UserActions.tsx | User-related actions (cart, profile, login) |

**Recommendation**: These components are already well-organized in the root of `components/`. They do NOT need to be merged with anything.

### 1.2 Admin Form Components (NEED CONSOLIDATION)
Location: `front/src/components/admin/`

| Component | File | Issues |
|-----------|------|--------|
| ProductForm | ProductForm.tsx | Too many props (30+) |
| BasicInfoSection | BasicInfoSection.tsx | Contains 4 different input types |
| FileStockSection | FileStockSection.tsx | Contains 4 different input types |
| CategorySelector | CategorySelector.tsx | Uses button tags as toggle |
| LicenseManager | LicenseManager.tsx | Uses custom buttons |
| LicenseRow | LicenseRow.tsx | Contains select and input |
| StatusSection | StatusSection.tsx | Contains checkboxes |
| FormButtons | FormButtons.tsx | Only 2 buttons |
| ErrorMessage | ErrorMessage.tsx | Only error display |
| LoadingSpinner | LoadingSpinner.tsx | Simple spinner |

### 1.3 Auth Forms (NEED COMPONENT EXTRACTION)
Location: `front/src/app/[lang]/login/page.tsx` and `register/page.tsx`

- Inline form inputs (email, password, name)
- Duplicate error handling
- Duplicate button styling
- No reusable form components

### 1.4 Catalog Components
Location: `front/src/app/[lang]/catalog/page.tsx`

- Inline filters (search, type, price range)
- Inline select for sorting
- Duplicate input styling with admin forms

---

## 2. Universal Components to Create

### 2.1 Button Component
**Location**: `front/src/components/ui/Button.tsx`

**Variants** (CSS classes):
- `primary`: `bg-primary text-white hover:bg-primary/90`
- `secondary`: `border border-gray-300 hover:bg-gray-50`
- `danger`: `bg-red-500 text-white hover:bg-red-600`
- `outline`: `border border-primary text-primary hover:bg-primary/10`
- `ghost`: `text-primary hover:bg-primary/10`

**Sizes**:
- `sm`: `px-3 py-1 text-sm`
- `md`: `px-4 py-2`
- `lg`: `px-6 py-3`

**Props**:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}
```

**Current usages to replace**:
- `FormButtons.tsx`: Submit and cancel buttons
- `CategorySelector.tsx`: Category toggle buttons
- `LicenseManager.tsx`: Add license button
- `LicenseRow.tsx`: Remove button
- `login/page.tsx`: Submit button
- `register/page.tsx`: Submit button
- `profile/page.tsx`: Logout button
- `catalog/page.tsx`: Reset and Load More buttons

---

### 2.2 Input Component
**Location**: `front/src/components/ui/Input.tsx`

**Types supported**:
- `text`: Standard text input
- `email`: Email validation
- `password`: Password input
- `number`: Numeric input with min/max/step
- `url`: URL validation
- `date`: Date picker
- `tel`: Phone number

**Props**:
```typescript
interface InputProps {
  // Base
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'date' | 'tel';
  name: string;
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  
  // Number-specific constraints
  min?: number;                    // Minimum value
  max?: number;                   // Maximum value
  step?: number;                  // Step increment (e.g., 0.01 for decimals)
  decimals?: number;              // Max decimal places (e.g., 2 for 10.50)
  allowNegative?: boolean;        // Allow negative numbers
  numberType?: 'integer' | 'float' | 'currency';  // Type of number input
  
  // Text-specific constraints
  minLength?: number;             // Minimum characters
  maxLength?: number;             // Maximum characters
  autoResize?: boolean;           // Auto-expand height for textarea-like behavior
  
  // Formatting
  prefix?: string;                // Prefix (e.g., '

**Current usages to replace**:
- `BasicInfoSection.tsx`: name, description (textarea), sku inputs
- `FileStockSection.tsx`: fileUrl, price, stock, discountPrice inputs
- `LicenseRow.tsx`: price input
- `login/page.tsx`: email, password inputs
- `register/page.tsx`: name, email, password, confirmPassword inputs
- `catalog/page.tsx`: search, minPrice, maxPrice inputs

---

### 2.3 Textarea Component
**Location**: `front/src/components/ui/Textarea.tsx`

**Props**:
```typescript
interface TextareaProps {
  name: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}
```

---

### 2.4 Select Component
**Location**: `front/src/components/ui/Select.tsx`

**Props**:
```typescript
interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  name: string;
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}
```

**Current usages to replace**:
- `BasicInfoSection.tsx`: Product type select
- `LicenseRow.tsx`: License type select
- `catalog/page.tsx`: Type filter, Sort select

---

### 2.5 Checkbox Component
**Location**: `front/src/components/ui/Checkbox.tsx`

**Props**:
```typescript
interface CheckboxProps {
  name: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}
```

**Current usages to replace**:
- `StatusSection.tsx`: isActive, isFeatured checkboxes

---

### 2.6 CheckboxGroup Component
**Location**: `front/src/components/ui/CheckboxGroup.tsx`

**Props**:
```typescript
interface CheckboxGroupProps<T> {
  name: string;
  label?: string;
  options: { value: T; label: string }[];
  selectedValues: T[];
  onChange: (values: T[]) => void;
  layout?: 'vertical' | 'horizontal' | 'grid';
  className?: string;
}
```

**Current usages to replace**:
- `CategorySelector.tsx`: Category selection (needs refactoring from buttons)

---

### 2.7 FormField Component (Wrapper)
**Location**: `front/src/components/ui/FormField.tsx`

**Purpose**: Wraps label + input + error message

**Props**:
```typescript
interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}
```

---

### 2.8 Alert Component
**Location**: `front/src/components/ui/Alert.tsx`

**Types**:
- `error`: Red background, red border
- `success`: Green background, green border
- `warning`: Yellow background, yellow border
- `info`: Blue background, blue border

**Props**:
```typescript
type AlertVariant = 'error' | 'success' | 'warning' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}
```

**Current usages to replace**:
- `ErrorMessage.tsx`: Only error variant
- Inline error divs in login, register pages

---

### 2.9 Spinner Component
**Location**: `front/src/components/ui/Spinner.tsx`

**Props**:
```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**Current usages to replace**:
- `LoadingSpinner.tsx`

---

### 2.10 Card Component
**Location**: `front/src/components/ui/Card.tsx`

**Props**:
```typescript
interface CardProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}
```

**Current usages to replace**:
- All sections in admin forms (BasicInfoSection, FileStockSection, etc.)
- ProductCard can extend this

---

### 2.11 Section Component (Admin Forms)
**Location**: `front/src/components/ui/Section.tsx`

**Purpose**: Standard admin panel section with title

**Props**:
```typescript
interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}
```

---

## 3. Component Directory Structure

```
front/src/components/
├── ui/                          # NEW: Universal UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Textarea.tsx
│   ├── Select.tsx
│   ├── Checkbox.tsx
│   ├── CheckboxGroup.tsx
│   ├── FormField.tsx
│   ├── Alert.tsx
│   ├── Spinner.tsx
│   ├── Card.tsx
│   └── Section.tsx
├── navigation/                  # NEW: Navigation components (already exists conceptually)
│   ├── Header.tsx              # Keep as is
│   ├── Navigation.tsx          # Keep as is
│   ├── NavButton.tsx           # Keep as is
│   ├── Logo.tsx                # Keep as is
│   ├── LanguageSwitcher.tsx    # Keep as is
│   └── UserActions.tsx         # Keep as is
├── admin/                       # Keep as is, refactor to use ui/
│   ├── ProductForm.tsx         # Refactor to use ui components
│   ├── BasicInfoSection.tsx    # Refactor to use ui components
│   ├── FileStockSection.tsx    # Refactor to use ui components
│   ├── CategorySelector.tsx    # Refactor to use CheckboxGroup
│   ├── LicenseManager.tsx      # Refactor to use ui components
│   ├── LicenseRow.tsx          # Refactor to use ui components
│   ├── StatusSection.tsx       # Refactor to use Checkbox
│   ├── FormButtons.tsx         # DEPRECATE - use Button
│   ├── ErrorMessage.tsx        # DEPRECATE - use Alert
│   └── LoadingSpinner.tsx      # DEPRECATE - use Spinner
├── ProductCard.tsx             # Refactor to use Card
├── Hero.tsx                    # Keep as is
├── Image.tsx                   # Keep as is
└── ProtectedRoute.tsx          # Keep as is
```

---

## 4. Implementation Order

### Phase 1: Create Universal UI Components
1. Create `ui/` directory
2. Implement Button with all variants
3. Implement Input with all types
4. Implement Textarea
5. Implement Select
6. Implement Checkbox
7. Implement FormField
8. Implement Alert
9. Implement Spinner
10. Implement Card
11. Implement Section

### Phase 2: Update Admin Components
1. Update FormButtons to use Button
2. Update ErrorMessage to use Alert
3. Update LoadingSpinner to use Spinner
4. Refactor BasicInfoSection using Input, Textarea, Select
5. Refactor FileStockSection using Input
6. Refactor CategorySelector using CheckboxGroup
7. Refactor LicenseRow using Input, Select
8. Refactor LicenseManager using Button
9. Refactor StatusSection using Checkbox
10. Simplify ProductForm by delegating to sections

### Phase 3: Update Auth Forms
1. Extract login form to reusable auth components
2. Update login/page.tsx using ui components
3. Update register/page.tsx using ui components

### Phase 4: Update Other Pages
1. Update catalog/page.tsx using ui components
2. Update profile/page.tsx using ui components

---

## 5. Benefits of This Refactoring

| Benefit | Description |
|---------|-------------|
| Consistency | All forms and inputs will look and behave the same |
| Maintainability | Changes to input styling need to happen in one place |
| Type Safety | Centralized props interfaces with TypeScript |
| Reusability | New forms can be built quickly using existing components |
| Testability | UI components can be unit tested independently |
| Accessibility | Centralized accessibility features |

---

## 6. Migration Notes

### Breaking Changes
- Component prop names may change (e.g., `onValueChange` instead of direct handlers)
- CSS class names will be consistent but may differ from current implementation

### Backward Compatibility
- Keep old components as thin wrappers around new ones during transition
- Export both old and new APIs initially

### Testing Strategy
1. Create unit tests for each new UI component
2. Create integration tests for form workflows
3. Visual regression testing for UI consistency
)
  suffix?: string;               // Suffix (e.g., 'px')
  formatter?: (value: string) => string;  // Custom formatter
}
```

**Auto-resize behavior for text**:
- When `autoResize={true}`, the input will:
  - Start with defined `rows` (default: 1)
  - Automatically grow in height as user types
  - Shrink back when content is deleted
  - Use `maxLength` or CSS `max-height` as limit

**Number input behavior**:
- `decimals: 0` → Integer only (1, 2, 3)
- `decimals: 2` → 2 decimal places (1.50, 10.99)
- `step: 0.01` allows decimal increment
- `numberType: 'currency'` → Auto-formats with 2 decimals

**Current usages to replace**:
- `BasicInfoSection.tsx`: name, description (textarea), sku inputs
- `FileStockSection.tsx`: fileUrl, price, stock, discountPrice inputs
- `LicenseRow.tsx`: price input
- `login/page.tsx`: email, password inputs
- `register/page.tsx`: name, email, password, confirmPassword inputs
- `catalog/page.tsx`: search, minPrice, maxPrice inputs

---

### 2.3 Textarea Component
**Location**: `front/src/components/ui/Textarea.tsx`

**Props**:
```typescript
interface TextareaProps {
  name: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}
```

---

### 2.4 Select Component
**Location**: `front/src/components/ui/Select.tsx`

**Props**:
```typescript
interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  name: string;
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}
```

**Current usages to replace**:
- `BasicInfoSection.tsx`: Product type select
- `LicenseRow.tsx`: License type select
- `catalog/page.tsx`: Type filter, Sort select

---

### 2.5 Checkbox Component
**Location**: `front/src/components/ui/Checkbox.tsx`

**Props**:
```typescript
interface CheckboxProps {
  name: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}
```

**Current usages to replace**:
- `StatusSection.tsx`: isActive, isFeatured checkboxes

---

### 2.6 CheckboxGroup Component
**Location**: `front/src/components/ui/CheckboxGroup.tsx`

**Props**:
```typescript
interface CheckboxGroupProps<T> {
  name: string;
  label?: string;
  options: { value: T; label: string }[];
  selectedValues: T[];
  onChange: (values: T[]) => void;
  layout?: 'vertical' | 'horizontal' | 'grid';
  className?: string;
}
```

**Current usages to replace**:
- `CategorySelector.tsx`: Category selection (needs refactoring from buttons)

---

### 2.7 FormField Component (Wrapper)
**Location**: `front/src/components/ui/FormField.tsx`

**Purpose**: Wraps label + input + error message

**Props**:
```typescript
interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}
```

---

### 2.8 Alert Component
**Location**: `front/src/components/ui/Alert.tsx`

**Types**:
- `error`: Red background, red border
- `success`: Green background, green border
- `warning`: Yellow background, yellow border
- `info`: Blue background, blue border

**Props**:
```typescript
type AlertVariant = 'error' | 'success' | 'warning' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}
```

**Current usages to replace**:
- `ErrorMessage.tsx`: Only error variant
- Inline error divs in login, register pages

---

### 2.9 Spinner Component
**Location**: `front/src/components/ui/Spinner.tsx`

**Props**:
```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**Current usages to replace**:
- `LoadingSpinner.tsx`

---

### 2.10 Card Component
**Location**: `front/src/components/ui/Card.tsx`

**Props**:
```typescript
interface CardProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}
```

**Current usages to replace**:
- All sections in admin forms (BasicInfoSection, FileStockSection, etc.)
- ProductCard can extend this

---

### 2.11 Section Component (Admin Forms)
**Location**: `front/src/components/ui/Section.tsx`

**Purpose**: Standard admin panel section with title

**Props**:
```typescript
interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}
```

---

## 3. Component Directory Structure

```
front/src/components/
├── ui/                          # NEW: Universal UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Textarea.tsx
│   ├── Select.tsx
│   ├── Checkbox.tsx
│   ├── CheckboxGroup.tsx
│   ├── FormField.tsx
│   ├── Alert.tsx
│   ├── Spinner.tsx
│   ├── Card.tsx
│   └── Section.tsx
├── navigation/                  # NEW: Navigation components (already exists conceptually)
│   ├── Header.tsx              # Keep as is
│   ├── Navigation.tsx          # Keep as is
│   ├── NavButton.tsx           # Keep as is
│   ├── Logo.tsx                # Keep as is
│   ├── LanguageSwitcher.tsx    # Keep as is
│   └── UserActions.tsx         # Keep as is
├── admin/                       # Keep as is, refactor to use ui/
│   ├── ProductForm.tsx         # Refactor to use ui components
│   ├── BasicInfoSection.tsx    # Refactor to use ui components
│   ├── FileStockSection.tsx    # Refactor to use ui components
│   ├── CategorySelector.tsx    # Refactor to use CheckboxGroup
│   ├── LicenseManager.tsx      # Refactor to use ui components
│   ├── LicenseRow.tsx          # Refactor to use ui components
│   ├── StatusSection.tsx       # Refactor to use Checkbox
│   ├── FormButtons.tsx         # DEPRECATE - use Button
│   ├── ErrorMessage.tsx        # DEPRECATE - use Alert
│   └── LoadingSpinner.tsx      # DEPRECATE - use Spinner
├── ProductCard.tsx             # Refactor to use Card
├── Hero.tsx                    # Keep as is
├── Image.tsx                   # Keep as is
└── ProtectedRoute.tsx          # Keep as is
```

---

## 4. Implementation Order

### Phase 1: Create Universal UI Components
1. Create `ui/` directory
2. Implement Button with all variants
3. Implement Input with all types
4. Implement Textarea
5. Implement Select
6. Implement Checkbox
7. Implement FormField
8. Implement Alert
9. Implement Spinner
10. Implement Card
11. Implement Section

### Phase 2: Update Admin Components
1. Update FormButtons to use Button
2. Update ErrorMessage to use Alert
3. Update LoadingSpinner to use Spinner
4. Refactor BasicInfoSection using Input, Textarea, Select
5. Refactor FileStockSection using Input
6. Refactor CategorySelector using CheckboxGroup
7. Refactor LicenseRow using Input, Select
8. Refactor LicenseManager using Button
9. Refactor StatusSection using Checkbox
10. Simplify ProductForm by delegating to sections

### Phase 3: Update Auth Forms
1. Extract login form to reusable auth components
2. Update login/page.tsx using ui components
3. Update register/page.tsx using ui components

### Phase 4: Update Other Pages
1. Update catalog/page.tsx using ui components
2. Update profile/page.tsx using ui components

---

## 5. Benefits of This Refactoring

| Benefit | Description |
|---------|-------------|
| Consistency | All forms and inputs will look and behave the same |
| Maintainability | Changes to input styling need to happen in one place |
| Type Safety | Centralized props interfaces with TypeScript |
| Reusability | New forms can be built quickly using existing components |
| Testability | UI components can be unit tested independently |
| Accessibility | Centralized accessibility features |

---

## 6. Migration Notes

### Breaking Changes
- Component prop names may change (e.g., `onValueChange` instead of direct handlers)
- CSS class names will be consistent but may differ from current implementation

### Backward Compatibility
- Keep old components as thin wrappers around new ones during transition
- Export both old and new APIs initially

### Testing Strategy
1. Create unit tests for each new UI component
2. Create integration tests for form workflows
3. Visual regression testing for UI consistency
