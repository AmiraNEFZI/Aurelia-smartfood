import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Download, Trash2, Edit, Search } from 'lucide-react'
import { Button, Badge, Avatar, AvatarGroup, Input, Card, CardHeader, CardBody } from '@/admin/components/ui'

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3 }}>
      <Card>
        <CardHeader title={title}>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </CardHeader>
        <CardBody className="pt-5">{children}</CardBody>
      </Card>
    </motion.div>
  )
}

export function ComponentsPage() {
  const [inputVal, setInputVal] = useState('')

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Component Showcase</h1>
        <p className="text-slate-500 text-sm mt-1">All admin UI components. Copy patterns directly into your pages.</p>
      </div>

      <Section title="Buttons" description="6 variants × 6 sizes, loading state, icon support">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-slate-600 uppercase tracking-wider font-medium mb-3">Variants</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="accent">Accent</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-600 uppercase tracking-wider font-medium mb-3">States & Icons</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
              <Button icon={<Plus className="w-3.5 h-3.5" />}>Add Item</Button>
              <Button variant="outline" icon={<Download className="w-3.5 h-3.5" />}>Export</Button>
              <Button variant="ghost" icon={<Edit className="w-3.5 h-3.5" />}>Edit</Button>
              <Button variant="destructive" icon={<Trash2 className="w-3.5 h-3.5" />}>Delete</Button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Badges" description="7 semantic variants with optional dot indicator">
        <div className="flex flex-wrap gap-3">
          <Badge variant="success" dot>Active</Badge>
          <Badge variant="warning" dot>Pending</Badge>
          <Badge variant="danger" dot>Failed</Badge>
          <Badge variant="info" dot>Draft</Badge>
          <Badge variant="primary" dot>New</Badge>
          <Badge variant="accent" dot>Live</Badge>
          <Badge variant="neutral" dot>Inactive</Badge>
        </div>
      </Section>

      <Section title="Avatars" description="Gradient initials, online indicator, and groups">
        <div className="flex items-end gap-4 flex-wrap">
          <Avatar initials="AC" size="xs" />
          <Avatar initials="SK" size="sm" />
          <Avatar initials="MW" size="md" />
          <Avatar initials="PP" size="lg" online={true} />
          <Avatar initials="JL" size="xl" online={false} />
          <AvatarGroup avatars={[{ initials: 'AC' }, { initials: 'SK' }, { initials: 'MW' }, { initials: 'PP' }, { initials: 'JL' }]} max={4} />
        </div>
      </Section>

      <Section title="Inputs" description="Label, prefix, suffix, error, and hint states">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Default" placeholder="Enter text..." value={inputVal} onChange={e => setInputVal(e.target.value)} />
          <Input label="With prefix" prefix={<Search className="w-3.5 h-3.5" />} placeholder="Search..." />
          <Input label="With hint" placeholder="your@email.com" hint="We'll never share your email." />
          <Input label="Error state" placeholder="Enter value..." error="This field is required" />
          <Input label="Disabled" placeholder="Disabled input" disabled />
        </div>
      </Section>

      <Section title="Cards" description="Glass, gradient border, and standard variants">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5"><h4 className="text-sm font-semibold text-slate-200 mb-1">Standard Card</h4><p className="text-xs text-slate-500">Default surface with border</p></Card>
          <Card glass className="p-5"><h4 className="text-sm font-semibold text-slate-200 mb-1">Glass Card</h4><p className="text-xs text-slate-500">Backdrop blur + transparency</p></Card>
          <Card gradient className="p-5"><h4 className="text-sm font-semibold text-slate-200 mb-1">Gradient Border</h4><p className="text-xs text-slate-500">Violet → cyan gradient border</p></Card>
        </div>
      </Section>
    </div>
  )
}
