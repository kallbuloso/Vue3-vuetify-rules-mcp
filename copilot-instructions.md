# Copilot Instructions for lyder

## Visao Geral do Projeto
- **Backend:** Laravel 12 com arquitetura MVC estendida por camada de servicos (`app/Services`), multi-tenancy via `TenantableTrait`, permissoes com `spatie/laravel-permission` e sistema de toasts via `ToastService`.
- **Frontend:** Inertia.js com Vue 3 (Composition API), Vuetify 3, Pinia com persistencia, Momentum Modal, Ziggy e Axios configurado como plugin.
- **Dominio:** Portal administrativo multi-tenant (cadastro de usuarios, papeis, empresas, contatos), com feedback do backend exibido no frontend via toasts.

## Convencoes Gerais
- Escreva labels, mensagens e comentarios em portugues-BR, mantendo o tom usado nas telas existentes.
- Toda logica deve respeitar o escopo de tenant: use traits e helpers existentes para preencher `tenant_id` e filtrar dados.
- Prefira os helpers existentes (`renderPage`, `renderModal`, `redirect()->toast()`, `can`, `swToast`, `route`, `usePage`) ao inves de criar variantes.
- Reaproveite componentes/construtos: verifique `resources/js/Blocks`, `resources/js/Components`, `resources/js/composables` antes de criar algo novo.
- Mantenha titulos e breadcrumbs atualizados ao renderizar paginas (propriedades passadas pelo controller).
- Quando criar servicos, rotas ou validacoes novas, atualize seeds/permissoes correspondentes.

## Backend Laravel
- **Controladores:** Estendem `App\Http\Controllers\Controller` e usam `renderPage`/`renderModal` para respostas Inertia/Momentum. Autorize acoes com `authorize()` ou policies do Spatie.
- **Requests:** Localizados em `app/Http/Requests/<Dominio>`; concentre validacoes e `authorize`. Use `prepareForValidation` para anexar `tenant_id` ou normalizar dados.
- **Servicos:** Cada entidade possui servico que estende `BaseService` (`applyFilters`, `with`, `paginate`, `getSearchable`). Reaproveite essa camada para encapsular queries e regras de negocio.
- **Models:** Implementam traits como `TenantableTrait`, `DatesModelTraits`, `UserTrait`. Atualize `$fillable` e `$searchable` sempre que adicionar campos.
- **Multi-tenancy:** `SetTenantIdInSession` garante tenant ativo; use `tenant()` helpers para obter contexto e nunca ignore os scopes do trait.
- **Toasts:** Use `redirect()->toast('Mensagem', 'success|error|info|warning')` ou `ToastService` para feedback server-side.
- **Gerador CRUD:** `app/Console/CrudGenerator` fornece stubs para model/controller/request/service/rotas. Ajuste stubs se precisar mudar padroes globais.
- **Fila e jobs:** O comando `composer dev` ja sobe `queue:listen`; cuide para que jobs e eventos preservem o tenant ativo.
- **Seeders & permissoes:** `database/seeders/PermissionSeeder.php` registra permissoes base. Atualize quando criar novas abilities usadas por `can()`.

## Frontend Inertia + Vue 3
- **Bootstrap:** `resources/js/app.js` registra Pinia (com persistencia), Momentum Modal (`modal`), Axios plugin (`Plugins/axios`), Ziggy e Vuetify (tema + icones). Adicione novos plugins aqui.
- **Estrutura de diretorios:**
  - `Pages/`: telas Inertia (ex.: `Settings/Role/Index.vue`). Use `<template layout="AppShell,AuthenticatedLayout">` para telas autenticadas.
  - `Layouts/`: casca da aplicacao (`AppShell.vue`, `AuthenticatedLayout.vue`, `GuestLayout.vue`, `LayoutProvider.vue`).
  - `Blocks/`: blocos de UI compostos (navegacao, formularios de auth, breadcrumbs, modais, enderecos, telefones).
  - `Components/`: componentes reutilizaveis (fields, comboboxes, checkboxes, toggles).
  - `composables/`: logica compartilhada (`useFieldMeta`, `useTheme`).
  - `utils/`: helpers como `helpers.js`, `validators.js`, `sweetAlert2.js`, `localeOptions.js`.
- **Padroes de codigo:**
  - Sempre use `<script setup>` com Composition API (JavaScript). Use `defineProps`, `defineEmits`, `defineOptions`.
  - Formularios Inertia usam `useForm`; manipule `form.post/put/delete` com `onSuccess/onError` e resete estados apropriados.
  - Permissoes no front sao tratadas com helper `can(resource, action)` e com os papeis disponiveis em `$page.props.auth.user.role`.
  - Use `usePage().props` para acessar dados globais (titulo, breadcrumbs, tenant, toasts).
  - Estado global via `useThemeStore` em `Stores/themeStore.js` (tema, drawer). Evite duplicar estado local para esses dados.
  - Modais baseiam-se em Momentum: controllers retornam `renderModal('Caminho')` e o front usa `<app-modal>`/`Modal` para renderizar.
- **Vuetify & tema:**
  - Configuracao central esta em `Plugins/vuetify.js`, `Plugins/defaults.js`, `Plugins/icons.js`, `Plugins/theme.js`. Respeite defaults (density `comfortable`, variant `outlined`, cores definidas).
  - Prefira wrappers (`app-text-field`, `app-select`, `app-name-field`) antes de instanciar componentes Vuetify diretamente.
  - Estilos customizados usam `<style lang="scss" scoped>`; siga padroes existentes e evite CSS global.
  - Utilize tokens do tema (`background`, `surface`, `primary`, etc.) em vez de cores fixas novas.
- **Layout e navegacao:**
  - `AuthenticatedLayout` controla drawer via `themeStore.isOpen` e exibe `b-navigation-app`, breadcrumbs (`app-breadcrumbs`), `app-theme-toggle`, `ScrollToTop`, `AppFooter`.
  - `AppShell` observa `usePage().props.toasts` e dispara `swToast` (SweetAlert2). Garanta que mensagens novas sigam esse fluxo.
  - Para responsividade, utilize utilitarios Vuetify (`useDisplay`, breakpoints `md`, `lg`) e mantenha TODOs de mobile em mente.
- **Tabelas e listas:**
  - `Settings/Role/Index.vue` mostra padrao de `v-data-table` com skeletons e acoes. Reutilize esse setup (density compact, slots `#loading`, `#item.action`).
  - Filtros e paginacao ficam em refs locais (`search`, `itemsPerPage`, `page`) e interagem com o backend via query params (quando implementado).

## Fluxos de Trabalho
- **Frontend:** `npm run dev` (Vite), `npm run build`, `npm run lint`, `npm run format`.
- **Backend:** `php artisan serve`, `php artisan migrate`, `php artisan queue:listen`, `php artisan test`.
- **Setup combinado:** `composer dev` executa servidor, fila e Vite em paralelo.
- **Testes:** `php artisan test` (Pest). Ainda nao ha testes frontend; siga convencoes Laravel/Pest se adicionar.
- **Seeds importantes:** `php artisan db:seed --class=PermissionSeeder`.
- **Rotas:** estao em `routes/web.php` com marcadores `// routeImport` e `// addRoute` para o gerador. Utilize esses comentarios se inserir novas rotas via stubs.

## Referencias Uteis
- `Context.md` resume arquitetura e links para trechos-chave.
- `resources/js/Pages/Settings/Role/Index.vue` demonstra tabelas com acoes e permissoes.
- `app/Services/BaseService.php` define os helpers usados por todos os servicos.
- `app/Providers/ToastServiceProvider.php` registra a macro `toast`.
- `resources/js/Layouts/AuthenticatedLayout.vue` mostra integracao de layout + navegacao.
- `resources/js/composables/useFieldMeta.js` mostra como padronizar metadados de campos.

---

Em caso de duvida sobre padroes nao documentados aqui, verifique implementacoes existentes antes de propor algo novo ou peca esclarecimentos.
