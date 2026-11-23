import { useState } from 'react'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ArrowUpRight, Bell, BookOpen, Check, ChevronRight, CircleHelp, Eye, EyeOff, FishSymbol, HardDriveDownload, LayoutDashboard, LockKeyhole, Menu, RefreshCw, Search, Settings2, Shield, ShieldCheck, Sparkles, UserRound, X } from 'lucide-react'
import { categories, checklistItems } from './data/checklistData'
import { getScoreLabel, getStats } from './utils/scoreCalculator'
import { getCategoryCoverage, getOutstandingByCategory, getPriorityCoverage } from './utils/analytics'
import { ChartCard, CoverageByCategory, OutstandingByCategory, PriorityComparison } from './components/Charts'
import { updateChecklistProgress } from './services/api'
import './App.css'

const iconMap = { LockKeyhole, ShieldCheck, RefreshCw, HardDriveDownload, FishSymbol, EyeOff }

const completionSeries = [
  { name: 'Completed', color: 'var(--viz-good)', value: (row) => row.completed },
  { name: 'Outstanding', color: 'var(--viz-risk)', value: (row) => row.remaining },
]

const outstandingSeries = [
  { name: 'High priority', color: 'var(--viz-risk-high)', value: (row) => row.high },
  { name: 'Medium priority', color: 'var(--viz-risk-low)', value: (row) => row.medium },
]

const dateFormat = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

function Brand() { return <Link to="/dashboard" className="brand"><span className="brand-mark"><Shield size={18} /></span><span>securely<span className="brand-dot">.</span></span></Link> }

export default function App() {
  const [items, setItems] = useState(checklistItems)
  const [toast, setToast] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const toggleItem = async (id) => {
    const current = items.find((item) => item.id === id)
    const completed = !current.completed
    setItems((list) => list.map((item) => item.id === id ? { ...item, completed } : item))
    await updateChecklistProgress(id, completed)
    setToast(completed ? 'Security check completed' : 'Security check marked incomplete')
    window.setTimeout(() => setToast(null), 2600)
  }
  return <BrowserRouter><Routes><Route path="/" element={<PublicPage page="home" />} /><Route path="/about" element={<PublicPage page="about" />} /><Route path="*" element={<AppLayout items={items} toggleItem={toggleItem} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} toast={toast} />} /></Routes></BrowserRouter>
}

function PublicHeader() {
  return <header className="public-header"><Brand /><nav className="public-nav"><NavLink to="/" end>Home</NavLink><NavLink to="/about">About</NavLink></nav><Link to="/dashboard" className="public-cta">Open dashboard <ArrowUpRight size={15} /></Link></header>
}

function PublicPage({ page }) {
  const content = {
    home: { eyebrow: 'PERSONAL SECURITY, SIMPLIFIED', title: <>Build better security habits, <i>one check at a time.</i></>, description: 'Understand your digital safety with a simple checklist made for everyday life.', action: 'Get started', icon: Shield },
    about: { eyebrow: 'ABOUT SECURELY', title: <>Security should feel <i>clear, not complicated.</i></>, description: 'Securely helps students and everyday users turn good security intentions into small, practical habits.', action: 'Open dashboard', icon: BookOpen },  }[page]
  return <div className="public-page"><PublicHeader /><main className="public-main"><section className="public-hero"><div className="public-hero-copy"><span className="eyebrow">{content.eyebrow}</span><h1>{content.title}</h1><p>{content.description}</p><Link to="/dashboard" className="primary-button">{content.action} <ArrowUpRight size={17} /></Link></div><div className="public-hero-art"><div className="public-icon"><content.icon size={34} /></div><span className="public-art-label">YOUR DIGITAL LIFE, IN FOCUS</span><strong>Your security, at a glance.</strong></div></section>{page === 'home' && <HomeDetails />}{page === 'about' && <AboutDetails />}</main></div>
}

function HomeDetails() { return <section className="public-cards"><article><ShieldCheck size={20} /><h2>Know what matters</h2><p>Work through focused checks for passwords, privacy, devices, and backups.</p></article><article><Check size={20} /><h2>Track your progress</h2><p>See your score improve as good habits become part of your routine.</p></article><article><ArrowUpRight size={20} /><h2>Take the next step</h2><p>Get clear recommendations without the noise or technical jargon.</p></article></section> }
function AboutDetails() { return <section className="public-content"><div><span className="eyebrow">OUR APPROACH</span><h2>Small actions add up.</h2></div><p>Securely is a focused space for learning the basics of personal cyber security. We turn an overwhelming topic into a calm, visible routine that you can return to whenever you need it.</p><Link to="/dashboard" className="text-link">Go to your dashboard <ArrowUpRight size={15} /></Link></section> }

function AppLayout({ items, toggleItem, mobileOpen, setMobileOpen, toast }) {
  const stats = getStats(items)
  return <div className="app-shell"><Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} remaining={stats.remaining} /><div className="main-shell"><Header setMobileOpen={setMobileOpen} /><main className="page-content"><Routes><Route path="/" element={<Navigate to="/dashboard" replace />} /><Route path="/dashboard" element={<Dashboard items={items} stats={stats} toggleItem={toggleItem} />} /><Route path="/checklist" element={<Checklist items={items} stats={stats} toggleItem={toggleItem} />} /><Route path="/recommendations" element={<Recommendations items={items} />} /><Route path="/profile" element={<Profile stats={stats} />} /><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes></main></div>{toast && <div className="toast"><span className="toast-icon"><Check size={15} /></span>{toast}<button aria-label="Dismiss"><X size={15} /></button></div>}</div>
}

function Sidebar({ mobileOpen, setMobileOpen, remaining }) {
  const links = [{ to: '/dashboard', label: 'Overview', icon: LayoutDashboard }, { to: '/checklist', label: 'Security Checklist', icon: ShieldCheck }, { to: '/recommendations', label: 'Recommendations', icon: Sparkles }, { to: '/profile', label: 'Profile', icon: UserRound }]
  return <><aside className={`sidebar ${mobileOpen ? 'open' : ''}`}><div className="sidebar-top"><Brand /><button className="mobile-close icon-button" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={19} /></button></div><div className="workspace-label">WORKSPACE <span>PERSONAL</span></div><nav>{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={18} /><span>{label}</span>{label === 'Recommendations' && remaining > 0 && <span className="nav-count">{remaining}</span>}</NavLink>)}</nav><div className="sidebar-bottom"><div className="help-card"><CircleHelp size={17} /><div><strong>Need a hand?</strong><small>Review your security basics</small></div><ChevronRight size={15} /></div><div className="sidebar-user"><div className="avatar">P</div><div className="user-copy"><strong>Palak</strong><small>palak@example.com</small></div><Settings2 size={16} /></div></div></aside>{mobileOpen && <button className="drawer-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}</>
}

function Header({ setMobileOpen }) { const location = useLocation(); return <header className="topbar"><button className="menu-button icon-button" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={21} /></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={13} /><strong>{location.pathname.split('/')[1] || 'dashboard'}</strong></div><div className="top-actions"><button className="icon-button notification" aria-label="Notifications"><Bell size={18} /><i /></button><div className="top-avatar">P</div><div className="top-user"><strong>Palak</strong><small>Personal workspace</small></div><ChevronRight size={15} className="chevron-down" /></div></header> }
function PageHeading({ eyebrow, title, description, action }) { return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div> }
function SecurityScore({ stats }) { const scoreLabel = getScoreLabel(stats.score); return <div className="score-card"><div className="score-head"><div><span className="eyebrow">SECURITY SCORE</span><h2>{stats.score}<small>/100</small></h2></div><div className={`score-status status-${scoreLabel.tone}`}><span />{scoreLabel.label}</div></div><div className="score-meter"><div className="score-meter-fill" style={{ width: `${stats.score}%` }} /></div><div className="score-footer"><span>Overall protection</span><span>{stats.completed} of {stats.total} checks complete</span></div></div> }
function StatCard({ icon: Icon, label, value, note, tone }) { return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={18} /></div><div className="stat-meta"><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div> }
function CategoryCard({ category, items }) { const Icon = iconMap[category.icon]; const matches = items.filter((item) => item.category === category.name); const completed = matches.filter((item) => item.completed).length; const percent = Math.round((completed / matches.length) * 100); return <Link to={`/checklist?category=${encodeURIComponent(category.name)}`} className="category-card"><div className="category-top"><span className={`category-icon ${category.accent}`}><Icon size={18} /></span><ChevronRight size={16} /></div><h3>{category.name}</h3><div className="category-progress"><div><span>{completed} / {matches.length} completed</span><strong>{percent}%</strong></div><div className="progress-track"><div className={`progress-fill ${category.accent}`} style={{ width: `${percent}%` }} /></div></div></Link> }
function Analytics({ items, stats }) {
  const coverage = getCategoryCoverage(items)
  const priority = getPriorityCoverage(items)
  const outstanding = getOutstandingByCategory(items)
  const strongest = coverage[0]
  const weakest = coverage[coverage.length - 1]
  return <section className="section-row">
    <div className="section-title">
      <div><span className="eyebrow">POSTURE ANALYTICS</span><h2>Compare where you stand</h2></div>
      <span className="section-note">{strongest.name} leads at {strongest.percent}% · {weakest.name} trails at {weakest.percent}%</span>
    </div>
    <div className="chart-grid">
      <ChartCard
        title="Coverage by category"
        subtitle={`Share of checks completed in each category. Overall ${stats.score}%.`}
        table={<table><thead><tr><th>Category</th><th>Completed</th><th>Total</th><th>Coverage</th></tr></thead><tbody>{coverage.map((row) => <tr key={row.name}><td>{row.name}</td><td>{row.completed}</td><td>{row.total}</td><td>{row.percent}%</td></tr>)}</tbody></table>}
      ><CoverageByCategory rows={coverage} /></ChartCard>
      <ChartCard
        title="Completed vs outstanding"
        subtitle="Checks grouped by the risk level they protect against."
        legend={completionSeries.map((entry) => ({ name: entry.name, color: entry.color }))}
        table={<table><thead><tr><th>Priority</th><th>Completed</th><th>Outstanding</th><th>Coverage</th></tr></thead><tbody>{priority.map((row) => <tr key={row.priority}><td>{row.priority}</td><td>{row.completed}</td><td>{row.remaining}</td><td>{row.percent}%</td></tr>)}</tbody></table>}
      ><PriorityComparison rows={priority} series={completionSeries} /></ChartCard>
      <ChartCard
        span
        title="Where the remaining work sits"
        subtitle="Outstanding checks per category, split by priority."
        legend={outstandingSeries.map((entry) => ({ name: entry.name, color: entry.color }))}
        table={<table><thead><tr><th>Category</th><th>High priority</th><th>Medium priority</th><th>Total outstanding</th></tr></thead><tbody>{outstanding.map((row) => <tr key={row.name}><td>{row.name}</td><td>{row.high}</td><td>{row.medium}</td><td>{row.total}</td></tr>)}</tbody></table>}
      ><OutstandingByCategory rows={outstanding} series={outstandingSeries} /></ChartCard>
    </div>
  </section>
}

function Dashboard({ items, stats, toggleItem }) {
  const incomplete = items.filter((item) => !item.completed).slice(0, 3)
  const nextScore = Math.min(100, Math.round((stats.completed + 1) / stats.total * 100))
  return <>
    <PageHeading eyebrow={dateFormat.format(new Date()).toUpperCase()} title="Good morning, Palak" description="A clearer view of your personal security posture." action={<button className="outline-button"><Eye size={16} /> View security report</button>} />
    <section className="hero-grid">
      <SecurityScore stats={stats} />
      <div className="focus-card"><div className="focus-orb"><ShieldCheck size={22} /></div><span className="eyebrow">TODAY'S FOCUS</span><h3>Small steps, stronger habits.</h3><p>Complete one more check to move your score to {nextScore}.</p><Link to="/checklist" className="text-link">Continue checklist <ArrowUpRight size={15} /></Link></div>
    </section>
    <section className="stats-grid">
      <StatCard icon={Check} label="Completed" value={stats.completed} note="checks secured" tone="mint" />
      <StatCard icon={CircleHelp} label="Remaining" value={stats.remaining} note="need your attention" tone="amber" />
      <StatCard icon={Shield} label="Total checks" value={stats.total} note={`across ${categories.length} categories`} tone="cyan" />
      <StatCard icon={Sparkles} label="Completion" value={`${stats.score}%`} note="overall progress" tone="violet" />
    </section>
    <Analytics items={items} stats={stats} />
    <div className="section-row">
      <div className="section-title"><div><span className="eyebrow">YOUR COVERAGE</span><h2>Security categories</h2></div><Link to="/checklist" className="text-link">View all <ArrowUpRight size={15} /></Link></div>
      <div className="category-grid">{categories.map((category) => <CategoryCard key={category.name} category={category} items={items} />)}</div>
    </div>
    <section className="recommendation-panel">
      <div className="section-title"><div><span className="eyebrow">NEXT BEST ACTIONS</span><h2>Recommended actions</h2></div><Link to="/recommendations" className="text-link">View all recommendations <ArrowUpRight size={15} /></Link></div>
      <div className="action-list">{incomplete.map((item) => <button className="action-row" key={item.id} onClick={() => toggleItem(item.id)}><span className="action-warning">!</span><span className="action-copy"><strong>{item.title}</strong><small>{item.category}</small></span><span className={`priority ${item.priority.toLowerCase()}`}>{item.priority}</span><ChevronRight size={16} /></button>)}</div>
    </section>
  </>
}

function Checklist({ items, stats, toggleItem }) { const [search, setSearch] = useState(''); const [category, setCategory] = useState('All categories'); const [status, setStatus] = useState('All status'); const filtered = items.filter((item) => item.title.toLowerCase().includes(search.toLowerCase()) && (category === 'All categories' || item.category === category) && (status === 'All status' || (status === 'Complete' ? item.completed : !item.completed))); return <><PageHeading eyebrow="SECURITY CENTER" title="Cyber security checklist" description="Build stronger habits by working through each check at your own pace." action={<div className="mini-score"><span>Score</span><strong>{stats.score}<small>/100</small></strong></div>} /><div className="checklist-toolbar"><div className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search checks..." /></div><select value={category} onChange={(event) => setCategory(event.target.value)}><option>All categories</option>{categories.map((item) => <option key={item.name}>{item.name}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All status</option><option>Complete</option><option>Incomplete</option></select></div><div className="checklist-progress"><div><span>Overall progress</span><strong>{stats.completed} of {stats.total} checks completed <em>{stats.score}%</em></strong></div><div className="progress-track"><div className="progress-fill mint" style={{ width: `${stats.score}%` }} /></div></div><div className="checklist-list">{filtered.length ? filtered.map((item) => <ChecklistItem key={item.id} item={item} toggleItem={toggleItem} />) : <EmptyState />}</div></> }
function ChecklistItem({ item, toggleItem }) { return <article className={`check-item ${item.completed ? 'is-complete' : ''}`}><button className="check-box" onClick={() => toggleItem(item.id)} aria-label={`${item.completed ? 'Mark incomplete' : 'Complete'} ${item.title}`}>{item.completed && <Check size={14} />}</button><div className="check-copy"><div className="check-title"><h3>{item.title}</h3><span className={`priority ${item.priority.toLowerCase()}`}>{item.priority}</span></div><p>{item.description}</p><span className="category-label">{item.category}</span></div><span className="check-status">{item.completed ? 'Completed' : 'Not started'}</span></article> }
function EmptyState() { return <div className="empty-state"><ShieldCheck size={28} /><h3>No security checks found</h3><p>Your current filters did not match any checks.</p></div> }
function Recommendations({ items }) { const recommendations = items.filter((item) => !item.completed); return <><PageHeading eyebrow="PERSONALIZED GUIDANCE" title="Security recommendations" description="Focus on the areas that need your attention most." /><div className="recommendations-layout"><div className="recommendations-intro"><div className="intro-number">{recommendations.length}</div><div><strong>checks waiting for you</strong><p>Prioritized by impact so you always know what to do next.</p></div></div><div className="recommendation-cards">{recommendations.map((item) => <article className="recommendation-card" key={item.id}><div className={`rec-icon ${item.priority.toLowerCase()}`}><Sparkles size={17} /></div><div className="rec-body"><div className="rec-title"><h3>{item.title}</h3><span className={`priority ${item.priority.toLowerCase()}`}>{item.priority}</span></div><p>{item.description}</p><div className="rec-foot"><span>{item.category}</span><Link to="/checklist">Complete this check <ArrowUpRight size={14} /></Link></div></div></article>)}</div></div></> }
function Profile({ stats }) { return <><PageHeading eyebrow="ACCOUNT" title="Your profile" description="Manage your account details and keep an eye on your progress." action={<button className="outline-button"><Settings2 size={16} /> Edit profile</button>} /><div className="profile-grid"><section className="profile-card"><div className="profile-identity"><div className="profile-avatar">P</div><div><h2>Palak</h2><p>palak@example.com</p><span>Member since March 2025</span></div></div><div className="profile-divider" /><div className="profile-fields"><div><span>Full name</span><strong>Palak</strong></div><div><span>Email address</span><strong>palak@example.com</strong></div></div></section><section className="profile-card"><span className="eyebrow">SECURITY SUMMARY</span><div className="profile-score"><strong>{stats.score}<small>/100</small></strong><span className={`score-status status-${getScoreLabel(stats.score).tone}`}><i />{getScoreLabel(stats.score).label}</span></div><div className="profile-stat"><span>Checks completed</span><strong>{stats.completed} / {stats.total}</strong></div><div className="profile-stat"><span>Completion rate</span><strong>{stats.score}%</strong></div><div className="progress-track"><div className="progress-fill mint" style={{ width: `${stats.score}%` }} /></div></section></div></> }
