# Configuration Files

## Colors (`colors.ts`)

This file centralizes all color definitions for the Hotel 360 Restaurant App. 

### Usage

```typescript
import { colors } from '@/config/colors';

// Use in components
const MyComponent = () => {
  return (
    <div style={{ backgroundColor: colors.primary }}>
      <h1 style={{ color: colors.primary }}>Title</h1>
    </div>
  );
};
```

### Available Colors

- `colors.primary` - Main brand color (#0476b1)
- `colors.primaryDark` - Darker version for gradients (#035a87)
- `colors.primaryLight` - Light background color (#f0f7fc)

### CSS Custom Properties

The colors are also available as CSS custom properties:

```css
.my-element {
  background-color: var(--brand-primary);
  color: var(--brand-primary-dark);
}
```

### Future Changes

To change the app's color scheme, simply update the values in `colors.ts` and the CSS custom properties in `globals.css`. All components will automatically use the new colors.
