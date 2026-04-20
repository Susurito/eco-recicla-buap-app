# 🧪 Testing Guide - Form Validation, Image Upload & Map Sync

## ✅ Implementación Completada Esta Sesión

### Cambios Realizados
1. **Imagen REQUERIDA en CREATE, OPCIONAL en EDIT**
   - `components/trash-point-form.tsx` línea 106-109
   - Validación: `isRequired` solo cuando `mode === "create"`

2. **Botón DISABLED si hay errores de validación**
   - `components/trash-point-form.tsx` línea 411-417
   - `disabled={isLoading || Object.keys(errors).length > 0}`

3. **Botón "Cambiar" para editar imagen**
   - `components/trash-point-form.tsx` línea 338-392
   - Usuario puede cambiar O borrar imagen sin cambiar otros campos

4. **Sincronización inmediata del mapa**
   - `components/eco-recicla-app.tsx` línea 321-360
   - `handlePointsUpdate` ahora aplica validación MOD4 (coordenadas con defaults BUAP_CENTER)
   - Contenedores nuevos aparecen inmediatamente en mapa

---

## 🚀 Como Probar - Guía Paso a Paso

### Setup Inicial
```bash
# Terminal 1: Iniciar servidor
cd "C:\Users\susur\Desktop\2026\Buap\7MO SEMESTRE\PROYECTOS I+D\Proyecto Final\eco-recicla-buap-app"
pnpm dev

# Navegador: Abre http://localhost:3000
```

---

## 📋 TEST CASE 1: Crear Contenedor (Admin)

### Pre-requisitos
- ✓ Estar logueado como admin
- ✓ Estar en la página principal (mapa visible)
- ✓ Build compiló sin errores

### Pasos

**1.1 - Validación de Campos Requeridos**
- [ ] Hacer clic en "Crear Contenedor"
- [ ] Botón "Crear" debe estar **DISABLED** (gris, no clickeable)
- [ ] **Razón**: Todos los campos están vacíos

**1.2 - Llenar Nombre**
- [ ] Escribir nombre (ej: "Contenedor Test 1")
- [ ] Botón "Crear" aún debe estar **DISABLED**
- [ ] **Razón**: Faltan: coordenadas, objeto detectado, imagen

**1.3 - Llenar Coordenadas**
- [ ] Hacer clic en el mapa para establecer coordenadas (o escribir manualmente)
- [ ] Ingresar coordenadas válidas (ej: 19.0326, -98.2332)
- [ ] Botón "Crear" aún debe estar **DISABLED**
- [ ] **Razón**: Faltan: objeto detectado, imagen

**1.4 - Seleccionar Objeto Detectado**
- [ ] Hacer clic en dropdown "Objeto Detectado"
- [ ] Seleccionar un objeto (ej: "Plástico")
- [ ] Botón "Crear" aún debe estar **DISABLED**
- [ ] **Razón**: Falta: imagen (REQUERIDA en CREATE)

**1.5 - Subir Imagen**
- [ ] Hacer clic en "Seleccionar Imagen"
- [ ] Seleccionar un archivo de imagen (.jpg, .png)
- [ ] Esperar a que suba (puede tomar 1-2 segundos)
- [ ] Ver preview de la imagen
- [ ] Botón "Crear" ahora debe estar **ENABLED** (azul, clickeable)
- [ ] **Razón**: Todos los campos están llenos y válidos

**1.6 - Error: Intentar sin Imagen**
- [ ] (Alternativo) Si no subiste imagen, ver que botón está disabled
- [ ] Intentar hacer clic en "Crear" → No debe hacer nada
- [ ] **Esperado**: No hay respuesta visual (botón disabled no responde a clic)

**1.7 - Crear Contenedor Exitosamente**
- [ ] Con todos los campos llenos, hacer clic en "Crear"
- [ ] Ver loading spinner/estado
- [ ] Esperar ~2-3 segundos
- [ ] **CRÍTICO**: Contenedor debe aparecer **INMEDIATAMENTE** en el mapa
  - Nueva marca debe ser visible sin refrescar página
  - Nueva línea debe aparecer en el sidebar derecho

**1.8 - Persistencia al Refrescar**
- [ ] Presionar F5 o hacer clic en refresh (Ctrl+R)
- [ ] Esperar a que cargue la página
- [ ] **CRÍTICO**: Contenedor debe SEGUIR VISIBLE en el mapa
  - Si desaparece: ERROR en sincronización
  - Si aparece: ✓ Sincronización funciona

**1.9 - Verificar sin Login (Usuario Público)**
- [ ] Abrir nuevo navegador incógnito
- [ ] Ir a http://localhost:3000
- [ ] Hacer logout si es necesario (o nueva pestaña)
- [ ] **CRÍTICO**: Contenedor recién creado debe ser visible
  - Usuarios sin login deben ver todos los contenedores
  - Si no aparece: ERROR en permisos de lectura

---

## 📋 TEST CASE 2: Editar Contenedor (Imagen Opcional)

### Pre-requisitos
- ✓ Tener un contenedor existente visible en el mapa
- ✓ Estar logueado como admin

### Pasos

**2.1 - Abrir Modal de Edición**
- [ ] Hacer clic en contenedor en el mapa O en el sidebar
- [ ] Hacer clic en botón "Editar" en el modal
- [ ] Se debe abrir el formulario de edición

**2.2 - Verificar Imagen es OPCIONAL**
- [ ] Ver la sección de imagen
- [ ] Si hay imagen actual:
  - [ ] Botón "X" para borrar
  - [ ] Botón "Cambiar" para subir nueva
  - [ ] Sección NO debe tener asterisco rojo `*` (a diferencia de CREATE)
- [ ] Si NO hay imagen:
  - [ ] Botón "Seleccionar Imagen"
  - [ ] SIN asterisco rojo (opcional)

**2.3 - Editar SOLO el nombre (sin cambiar imagen)**
- [ ] Cambiar nombre a "Contenedor Test 1 - Editado"
- [ ] NO hacer clic en "Cambiar" ni "Seleccionar"
- [ ] Hacer clic en "Actualizar"
- [ ] **ESPERADO**: 
  - Cambio se refleja inmediatamente en el mapa
  - Imagen NO se borra
  - Cambios persisten al refrescar

**2.4 - Cambiar Imagen**
- [ ] Abrir modal de edición del mismo contenedor
- [ ] Si hay imagen, hacer clic en botón "Cambiar"
- [ ] Seleccionar nueva imagen
- [ ] Ver nuevo preview
- [ ] Hacer clic en "Actualizar"
- [ ] **ESPERADO**: 
  - Imagen se cambia en BD
  - Preview actualiza inmediatamente

**2.5 - Borrar Imagen**
- [ ] Abrir modal de edición
- [ ] Si hay imagen, hacer clic en "X"
- [ ] Preview desaparece
- [ ] Hacer clic en "Actualizar"
- [ ] **ESPERADO**: 
  - Imagen se elimina
  - Otros campos NO se afectan

**2.6 - Botón Disabled en Edición con Errores**
- [ ] Abrir modal de edición
- [ ] Borrar el nombre (dejar vacío)
- [ ] Botón "Actualizar" debe estar **DISABLED**
- [ ] Escribir nombre nuevamente
- [ ] Botón "Actualizar" debe estar **ENABLED**

---

## 📋 TEST CASE 3: Ver Contenedores sin Login

### Pre-requisitos
- ✓ Tener al menos 1 contenedor creado en la BD
- ✓ Estar en incógnito o usuario diferente

### Pasos

**3.1 - Acceder sin Login**
- [ ] Nueva pestaña incógnito
- [ ] Ir a http://localhost:3000
- [ ] **ESPERADO**: Ver mapa con todos los contenedores

**3.2 - Ver Lista en Sidebar**
- [ ] Todos los contenedores deben estar listados en el panel derecho
- [ ] Hacer clic en uno para ver detalles en modal
- [ ] Modal debe mostrar información (nombre, coords, objeto, imagen si existe)

**3.3 - Sin Permisos de Edición/Eliminación**
- [ ] Modal NO debe tener botones "Editar" ni "Eliminar"
- [ ] Solo información de lectura

---

## 🔍 Verificación de Archivos Modificados

Después de testear, verifica que solo estos archivos fueron modificados (NO NUEVOS COMMITS):

```bash
git status
```

**Esperado:**
```
modified:   components/trash-point-form.tsx
modified:   components/eco-recicla-app.tsx
modified:   app/api/trash-points/route.ts (posiblemente)
modified:   app/api/trash-points/[id]/route.ts (posiblemente)
```

**NO debe haber:**
- ❌ Nuevos commits (`git log` no cambia)
- ❌ Archivos borrados
- ❌ Branches nuevas

---

## 🐛 Troubleshooting

### Problema: Botón "Crear" no se activa aunque todos los campos estén llenos

**Soluciones a intentar:**
1. Verifica consola del navegador (F12 → Console)
2. Busca errores al subir imagen
3. Verifica que la imagen se haya subido correctamente

**Si persiste:**
```bash
# Revisa logs en servidor
npm run dev
# Busca "errors" en el log
```

---

### Problema: Contenedor NO aparece en mapa después de crear

**Soluciones a intentar:**
1. Refrescar página (F5) - ¿Aparece después?
2. Revisar sidebar derecho - ¿Está en la lista?
3. Abre DevTools → Network tab → Verifica respuesta de POST /api/trash-points
4. Revisa la consola por errores

**Si POST es exitoso (200) pero no aparece:**
- Problema en `handlePointsUpdate` (línea 321-360 en eco-recicla-app.tsx)
- Verifica que coordenadas sean números válidos

---

### Problema: Contenedor desaparece después de refrescar

**Soluciones a intentar:**
1. Abre DevTools → Network tab → Verifica respuesta de GET /api/trash-points
2. Revisa datos en respuesta - ¿Está el contenedor?
3. Si está en respuesta pero no aparece: Problema en mapeo de datos
4. Si NO está en respuesta: Problema en BD

**Para debug completo:**
```bash
# Abre Prisma Studio
npx prisma studio

# Navega a TrashPoint
# ¿Ves el contenedor que creaste?
```

---

## 📊 Resumen de Cambios

| Cambio | Archivo | Líneas | Impacto |
|--------|---------|--------|---------|
| Imagen REQUERIDA en CREATE | trash-point-form.tsx | 106-109 | Validación |
| Botón DISABLED si hay errores | trash-point-form.tsx | 411-417 | UX |
| Botón "Cambiar" imagen | trash-point-form.tsx | 338-392 | UX |
| Sincronización con MOD4 | eco-recicla-app.tsx | 321-360 | **CRÍTICO** |

---

## ✅ Checklist Final

- [ ] Build compiló sin errores
- [ ] TEST CASE 1 - Crear contenedor (todos los pasos)
- [ ] TEST CASE 2 - Editar contenedor (todos los pasos)
- [ ] TEST CASE 3 - Ver como usuario público
- [ ] git status muestra solo cambios locales (sin commits)
- [ ] No hay archivos nuevos (excepto TESTING_GUIDE.md que ya existía)

**Status: ⏳ AWAITING LOCAL TESTING**

---

## 📱 URLs Importantes

- **Mapa Principal**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard
- **API Trash Points**: http://localhost:3000/api/trash-points
- **Prisma Studio**: `npx prisma studio`

---

## 💡 Notas Importantes

1. **Imagen es REQUERIDA** en modo CREATE, pero OPCIONAL en EDIT
2. **Botón "Cambiar"** permite editar imagen sin afectar otros campos
3. **MOD4**: Validación de coordenadas con defaults BUAP_CENTER
4. **Sincronización**: El mapa debe actualizar inmediatamente sin refrescar
5. **Público**: Todos deben ver contenedores, incluso sin login

---

**Actualizado**: Abril 19, 2026
**Última Sesión**: Form Validation, Image Handling, Map Sync
