export type DefaultCategoryDefinition = {
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
};

export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategoryDefinition[] = [
  { name: '餐饮', icon: 'food', color: '#F97316', sortOrder: 10 },
  { name: '交通', icon: 'transport', color: '#0EA5E9', sortOrder: 20 },
  { name: '购物', icon: 'shopping', color: '#EC4899', sortOrder: 30 },
  { name: '日用', icon: 'daily', color: '#14B8A6', sortOrder: 40 },
  { name: '住房', icon: 'house', color: '#8B5CF6', sortOrder: 50 },
  { name: '水电煤', icon: 'utilities', color: '#6366F1', sortOrder: 60 },
  { name: '娱乐', icon: 'entertainment', color: '#F59E0B', sortOrder: 70 },
  { name: '医疗', icon: 'medical', color: '#EF4444', sortOrder: 80 },
  { name: '学习', icon: 'study', color: '#22C55E', sortOrder: 90 },
  { name: '其他', icon: 'other', color: '#64748B', sortOrder: 100 },
];

export const DEFAULT_INCOME_CATEGORIES: DefaultCategoryDefinition[] = [
  { name: '工资', icon: 'salary', color: '#16A34A', sortOrder: 10 },
  { name: '奖金', icon: 'bonus', color: '#65A30D', sortOrder: 20 },
  { name: '报销', icon: 'reimburse', color: '#0891B2', sortOrder: 30 },
  { name: '转入', icon: 'transfer-in', color: '#2563EB', sortOrder: 40 },
  { name: '其他', icon: 'other', color: '#64748B', sortOrder: 50 },
];
