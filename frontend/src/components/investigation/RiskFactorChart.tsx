import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts"

interface Factor {
  name: string
  contribution: number
}

interface RiskFactorChartProps {
  data: Factor[]
}

export function RiskFactorChart({ data }: RiskFactorChartProps) {
  return (
    <div className="h-[250px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis 
            dataKey="name" 
            type="category" 
            stroke="hsl(var(--foreground))" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            width={140}
          />
          <Tooltip 
            cursor={{fill: 'hsl(var(--secondary)/0.1)'}}
            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
            formatter={(value: number) => [`+${value}%`, 'Contribution']}
          />
          <Bar dataKey="contribution" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={
                  entry.contribution > 25 ? 'hsl(var(--destructive))' : 
                  entry.contribution > 15 ? 'hsl(var(--orange-500, 24.6 95% 53.1%))' : 
                  'hsl(var(--warning))'
                } 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
