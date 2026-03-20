'use client';

const CATEGORY_COLORS: Record<string, string> = {
  Flower: '#2D7D46',
  Concentrates: '#D97706',
  Edibles: '#DB2777',
  'Pre-Rolls': '#2563EB',
  Extracts: '#7C3AED',
  Tinctures: '#0D9488',
  Beverages: '#06B6D4',
  Other: '#6B7280',
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other;
}

interface CategoryBadgeProps {
  category: string;
}

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  const color = getCategoryColor(category);

  return (
    <span
      style={{
        display: 'inline-block',
        backgroundColor: color,
        color: '#fff',
        padding: '3px 10px',
        borderRadius: 6,
        fontSize: '0.62rem',
        fontWeight: 700,
        fontFamily: "'Barlow', Arial, sans-serif",
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {category}
    </span>
  );
}
