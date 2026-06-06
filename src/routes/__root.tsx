import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,

} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import appCss from '../styles.css?url'
import { Toaster } from 'sonner'

interface MyRouterContext {
  queryClient: QueryClient
}

const THEME_INIT_SCRIPT = `(function(){try{var w=typeof window!=='undefined'?window:null;var d=w&&typeof document!=='undefined'?document:null;var root=d&&d.documentElement;if(!root)return;var stored=null;try{stored=w.localStorage.getItem('theme');}catch(e){if(w.console&&w.console.error)w.console.error('Theme init: localStorage read failed',e);}var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=false;try{prefersDark=w.matchMedia('(prefers-color-scheme: dark)').matches;}catch(e){if(w.console&&w.console.error)w.console.error('Theme init: matchMedia failed',e);}var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme');}else{root.setAttribute('data-theme',mode);}root.style.colorScheme=resolved;}catch(e){if(typeof window!=='undefined'&&window.console&&window.console.error){window.console.error('Theme init failed',e);}}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Sara Building — Transient Booking',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-body antialiased wrap-anywhere">
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Toaster /> 
        <Scripts />
      </body>
    </html>
  )
}
