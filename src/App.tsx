import { useCallback, useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PlatformHubPage } from './pages/PlatformHubPage';
import { MerchantStudioPage } from './pages/MerchantStudioPage';
import { StorefrontPage } from './pages/StorefrontPage';
import { CreateStoreModal } from './components/CreateStoreModal';
import type { TemplateId } from './types/commerce';

interface ParsedRoute {
  view: 'hub' | 'studio' | 'store' | 'preview';
  param?: string;
  queryStore?: string | null;
}

function parseLocation(): ParsedRoute {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const searchParams = new URLSearchParams(window.location.search);

  if (pathname === '/studio') {
    return { view: 'studio', queryStore: searchParams.get('store') };
  }
  if (pathname.startsWith('/s/')) {
    const slug = decodeURIComponent(pathname.slice(3).split('/')[0] || '');
    if (slug) return { view: 'store', param: slug };
  }
  if (pathname.startsWith('/preview/')) {
    const tpl = decodeURIComponent(pathname.slice(9).split('/')[0] || '');
    if (tpl) return { view: 'preview', param: tpl };
  }
  return { view: 'hub' };
}

function MarqueRouter() {
  const [route, setRoute] = useState<ParsedRoute>(parseLocation);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createInitialTemplate, setCreateInitialTemplate] =
    useState<TemplateId>('flagship');

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    setRoute(parseLocation());
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setRoute(parseLocation());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const openCreateModal = useCallback((templateId: TemplateId = 'flagship') => {
    setCreateInitialTemplate(templateId);
    setCreateModalOpen(true);
  }, []);

  return (
    <>
      {route.view === 'hub' && (
        <PlatformHubPage
          onNavigate={navigate}
          onStartWithTemplate={openCreateModal}
        />
      )}

      {route.view === 'studio' && (
        <MerchantStudioPage
          initialStoreSlug={route.queryStore}
          onNavigate={navigate}
          onOpenCreateModal={openCreateModal}
        />
      )}

      {route.view === 'store' && route.param && (
        <StorefrontPage
          mode="live"
          slugOrTemplate={route.param}
          onNavigate={navigate}
          onUseTemplate={openCreateModal}
        />
      )}

      {route.view === 'preview' && route.param && (
        <StorefrontPage
          mode="preview"
          slugOrTemplate={route.param}
          onNavigate={navigate}
          onUseTemplate={openCreateModal}
        />
      )}

      <CreateStoreModal
        open={createModalOpen}
        initialTemplate={createInitialTemplate}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(slug) => {
          setCreateModalOpen(false);
          navigate(`/studio?store=${slug}`);
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MarqueRouter />
      </AuthProvider>
    </ErrorBoundary>
  );
}
