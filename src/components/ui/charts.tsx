import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { SalesRow } from '@/lib/api'
import { formatMoney } from '@/lib/utils'

const axisStyle = { fontSize: 11, fill: '#9ca3af' }

export function SalesChart({ data, currency }: { data: SalesRow[]; currency: string }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
            formatter={(value) => [formatMoney(Number(value), currency), 'Revenue']}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#4f46e5"
            strokeWidth={2}
            fill="url(#revenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function OrdersChart({ data }: { data: SalesRow[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
            formatter={(value) => [value, 'Orders']}
          />
          <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
