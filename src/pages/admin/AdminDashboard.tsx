import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  FolderTree, 
  FileText, 
  Settings,
  BarChart3,
  Menu,
  LogOut,
  Home,
  Image,
  ChevronRight,
  Activity,
  Zap,
  BookOpen,
  ChevronLeft,
  Layers,
  Tag,
  MessageCircle,
  Camera,
  Users,
  ShieldCheck,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/context/AuthContext';
import { AdminProducts } from './AdminProducts';
import { AdminOrders } from './AdminOrders';
import { AdminCategories } from './AdminCategories';
import { AdminPages } from './AdminPages';
import { AdminSettings } from './AdminSettings';
import { AdminSales } from './AdminSales';
import { AdminBanners } from './AdminBanners';
import { AdminAPISettings } from './AdminAPISettings';
import { AdminPagesContent } from './AdminPagesContent';
import { AdminShowcase } from './AdminShowcase';
import { AdminCoupons } from './AdminCoupons';

import { AdminLifestyle } from './AdminLifestyle';
import { AdminUsers } from './AdminUsers';
import { AdminAdmins } from './AdminAdmins';
import { AdminReviews } from './AdminReviews';
import { AdminBrands } from './AdminBrands';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import logo from '@/assets/logo.webp';
import { AdminAccountMenu } from '@/components/AdminAccountMenu';

type Tab = 'dashboard' | 'products' | 'orders' | 'categories' | 'brands' | 'pages' | 'settings' | 'sales' | 'banners' | 'api-settings' | 'page-content' | 'showcase' | 'coupons' | 'lifestyle' | 'users' | 'admins' | 'reviews';

const menuGroups: { title: string; icon: any; items: { id: Tab; label: string; icon: any }[] }[] = [
  {
    title: 'Store Management',
    icon: ShoppingBag,
    items: [
      { id: 'products', label: 'Products', icon: Package },
      { id: 'categories', label: 'Categories', icon: FolderTree },
      { id: 'brands', label: 'Brands', icon: Sparkles },
      { id: 'banners', label: 'Banners', icon: Image },
      { id: 'orders', label: 'Orders', icon: ShoppingBag },
      { id: 'coupons', label: 'Coupons', icon: Tag },
      { id: 'reviews', label: 'Reviews', icon: MessageSquare },
    ],
  },
  {
    title: 'Content Management',
    icon: Layers,
    items: [
      { id: 'page-content', label: 'Page Content', icon: BookOpen },
      { id: 'showcase', label: 'Showcase', icon: Camera },
      { id: 'lifestyle', label: 'Lifestyle Gallery', icon: Image },
      { id: 'pages', label: 'Legal Pages', icon: FileText },
    ],
  },
  {
    title: 'User Management',
    icon: Users,
    items: [
      { id: 'users', label: 'Customers', icon: Users },
      { id: 'admins', label: 'Admins', icon: ShieldCheck },
    ],
  },
  {
    title: 'Finance & Reports',
    icon: BarChart3,
    items: [
      { id: 'sales', label: 'Sales Report', icon: BarChart3 },
    ],
  },
  {
    title: 'System Settings',
    icon: Settings,
    items: [
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'api-settings', label: 'API Settings', icon: Zap },
    ],
  },
];


const allMenuItems = menuGroups.flatMap(g => g.items);

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(['Store Management']);

  const { isAdmin, loading } = useAdmin();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-12 h-12 border-3 border-primary/20 rounded-full" />
            <div className="absolute inset-0 w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 max-w-sm"
        >
          <div className="w-14 h-14 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity size={24} className="text-destructive" />
          </div>
          <h1 className="text-xl font-semibold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground text-sm mb-6">
            You don't have permission to access this page.
          </p>
          <motion.button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Go Home
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'coupons':
        return <AdminCoupons />;
      case 'banners':
        return <AdminBanners />;
      case 'products':
        return <AdminProducts />;
      case 'reviews':
        return <AdminReviews />;
      case 'orders':
        return <AdminOrders />;
      case 'categories':
        return <AdminCategories />;
      case 'brands':
        return <AdminBrands />;
      case 'sales':
        return <AdminSales />;
      case 'page-content':
        return <AdminPagesContent />;
      case 'pages':
        return <AdminPages />;
      case 'settings':
        return <AdminSettings />;
      case 'api-settings':
        return <AdminAPISettings />;
      case 'users':
        return <AdminUsers />;
      case 'admins':
        return <AdminAdmins />;
      case 'lifestyle':
        return <AdminLifestyle />;
      case 'showcase':
        return <AdminShowcase />;

      default:
        return <DashboardOverview setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 76 : 272 }}
        className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 lg:h-screen lg:self-start bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="h-[76px] flex items-center px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img src={logo} alt="Imagine Computer" className="w-9 h-9 object-contain" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col leading-tight min-w-0">
                <span className="font-heading font-bold whitespace-nowrap text-[15px] truncate">Imagine Computer</span>
                <span className="text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/50">Dashboard</span>
              </div>
            )}
          </div>
        </div>

        {/* Admin identity card */}
        {!sidebarCollapsed && (
          <div className="mx-3 mt-3">
            <AdminAccountMenu />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin space-y-1">
          {/* Dashboard */}
          <button
            onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold'
                : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
            }`}
          >
            <LayoutDashboard size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </button>

          {menuGroups.map((group) => {
            const isOpen = openGroups.includes(group.title);
            const hasActive = group.items.some((i) => i.id === activeTab);
            return (
              <div key={group.title} className="border-t border-sidebar-border/60 pt-1 mt-1">
                <button
                  onClick={() => {
                    if (sidebarCollapsed) {
                      setSidebarCollapsed(false);
                      setOpenGroups([group.title]);
                      return;
                    }
                    setOpenGroups((prev) =>
                      prev.includes(group.title) ? prev.filter((t) => t !== group.title) : [...prev, group.title]
                    );
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    hasActive ? 'text-sidebar-primary font-semibold' : 'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                  }`}
                >
                  <group.icon size={18} className="flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left whitespace-nowrap">{group.title}</span>
                      <motion.span animate={{ rotate: isOpen ? 90 : 0 }}>
                        <ChevronRight size={15} className="opacity-60" />
                      </motion.span>
                    </>
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && !sidebarCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 ml-3 border-l border-sidebar-border space-y-0.5 py-1">
                        {group.items.map((item) => {
                          const active = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                                active
                                  ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold'
                                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                              }`}
                            >
                              <item.icon size={15} className="flex-shrink-0" />
                              <span className="whitespace-nowrap">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-sm"
          >
            <Home size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>View Store</span>}
          </button>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-sm"
          >
            <motion.div animate={{ rotate: sidebarCollapsed ? 180 : 0 }}>
              <ChevronLeft size={18} className="flex-shrink-0" />
            </motion.div>
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>

          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors text-sm"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>

      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border h-16 flex items-center px-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <Menu size={20} />
              </button>
              
              <div>
                <h2 className="font-semibold capitalize">{activeTab === 'dashboard' ? 'Dashboard Overview' : (allMenuItems.find((m) => m.id === activeTab)?.label || activeTab.replace('-', ' '))}</h2>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-2.5 py-1 bg-accent/10 rounded-full">
              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
              <span className="text-xs font-medium text-accent">Live</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

// Dashboard Overview Component
const DashboardOverview = ({ setActiveTab }: { setActiveTab: (tab: Tab) => void }) => {
  const [stats, setStats] = useState({
    products: 0, orders: 0, categories: 0, totalSales: 0,
    todayOrders: 0, todayRevenue: 0, pendingOrders: 0, lowStockProducts: 0,
  });
  const [topProducts, setTopProducts] = useState<{ name: string; count: number }[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [productsRes, ordersRes, categoriesRes, todayOrdersRes, pendingRes, lowStockRes, recentRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id, total_amount'),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id, total_amount').gte('created_at', todayISO),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('in_stock', false),
        supabase.from('orders').select('id, full_name, total_amount, status, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      const totalSales = ordersRes.data?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;
      const todayRevenue = todayOrdersRes.data?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;

      setStats({
        products: productsRes.count || 0,
        orders: ordersRes.data?.length || 0,
        categories: categoriesRes.count || 0,
        totalSales,
        todayOrders: todayOrdersRes.data?.length || 0,
        todayRevenue,
        pendingOrders: pendingRes.count || 0,
        lowStockProducts: lowStockRes.count || 0,
      });
      setRecentOrders(recentRes.data || []);

      const { data: topItems } = await supabase.from('order_items').select('product_name, quantity');
      if (topItems) {
        const productMap: Record<string, number> = {};
        topItems.forEach(item => { productMap[item.product_name] = (productMap[item.product_name] || 0) + item.quantity; });
        setTopProducts(Object.entries(productMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count })));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const statCards = [
    { title: "Today's Orders", value: stats.todayOrders, icon: ShoppingBag, onClick: () => setActiveTab('orders'), color: 'bg-brand-red/10 text-primary' },
    { title: "Today's Revenue", value: `৳${stats.todayRevenue.toLocaleString()}`, icon: BarChart3, onClick: () => setActiveTab('sales'), color: 'bg-accent/10 text-accent' },
    { title: 'Pending Orders', value: stats.pendingOrders, icon: Activity, onClick: () => setActiveTab('orders'), color: 'bg-muted text-foreground' },
    { title: 'Out of Stock', value: stats.lowStockProducts, icon: Package, onClick: () => setActiveTab('products'), color: 'bg-destructive/10 text-destructive' },
  ];

  const overallCards = [
    { title: 'Total Products', value: stats.products, icon: Package, onClick: () => setActiveTab('products') },
    { title: 'Total Orders', value: stats.orders, icon: ShoppingBag, onClick: () => setActiveTab('orders') },
    { title: 'Categories', value: stats.categories, icon: FolderTree, onClick: () => setActiveTab('categories') },
    { title: 'Total Sales', value: `৳${stats.totalSales.toLocaleString()}`, icon: BarChart3, onClick: () => setActiveTab('sales') },
  ];

  const quickActions = [
    { label: 'Add Product', icon: Package, tab: 'products' as Tab },
    { label: 'Banners', icon: Image, tab: 'banners' as Tab },
    { label: 'Orders', icon: ShoppingBag, tab: 'orders' as Tab },
    { label: 'Coupons', icon: Tag, tab: 'coupons' as Tab },
  ];

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-muted text-foreground';
      case 'confirmed': case 'processing': return 'bg-brand-red/10 text-primary';
      case 'shipped': return 'bg-accent/10 text-accent';
      case 'delivered': case 'completed': return 'bg-brand-red/15 text-primary';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Today</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} onClick={stat.onClick}
              className="bg-card rounded-xl p-5 border border-border cursor-pointer hover:border-primary/30 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}><stat.icon size={20} /></div>
                <ChevronRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Overall</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {overallCards.map((stat, index) => (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + index * 0.05 }} onClick={stat.onClick}
              className="bg-card rounded-xl p-5 border border-border cursor-pointer hover:border-primary/30 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-brand-red/10 rounded-lg flex items-center justify-center"><stat.icon size={20} className="text-primary" /></div>
                <ChevronRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Recent Orders</CardTitle></CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p> : (
              <div className="space-y-3">
                {recentOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{order.full_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">৳{Number(order.total_amount).toLocaleString()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(order.status)}`}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Top Selling Products</CardTitle></CardHeader>
          <CardContent>
            {topProducts.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No sales data yet</p> : (
              <div className="space-y-3">
                {topProducts.map((product, i) => (
                  <div key={product.name} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-brand-red/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">{i + 1}</span>
                      <p className="font-medium text-sm truncate max-w-[180px]">{product.name}</p>
                    </div>
                    <span className="text-sm font-semibold">{product.count} sold</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {quickActions.map((action, index) => (
            <motion.button key={action.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + index * 0.05 }}
              onClick={() => setActiveTab(action.tab)} className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:bg-secondary/30 transition-all">
              <div className="w-9 h-9 bg-secondary rounded-lg flex items-center justify-center"><action.icon size={18} className="text-foreground" /></div>
              <span className="font-medium text-xs">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
