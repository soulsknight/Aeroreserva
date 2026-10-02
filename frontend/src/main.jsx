import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AirVent,
  AlarmClock,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  CloudSun,
  Download,
  FileClock,
  Filter,
  Grid2X2,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Plane,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import "./styles.css";

const reservations = [
  {
    id: 1,
    time: "07:30",
    end: "09:00",
    title: "Vuelo de instrucción",
    person: "Mateo Rojas",
    plane: "CC-KAA",
    model: "Cessna 172",
    status: "confirmed",
    mine: true,
    tone: "teal",
  },
  {
    id: 2,
    time: "09:30",
    end: "11:00",
    title: "Bloqueo de mantenimiento",
    person: "Mantenimiento",
    plane: "CC-KAB",
    model: "Piper PA-28",
    status: "blocked",
    mine: false,
    tone: "amber",
  },
  {
    id: 3,
    time: "10:00",
    end: "11:30",
    title: "Franja ocupada",
    person: "Reserva privada",
    plane: "CC-KAC",
    model: "Cessna 172",
    status: "busy",
    mine: false,
    tone: "slate",
  },
  {
    id: 4,
    time: "12:30",
    end: "14:00",
    title: "Vuelo de instrucción",
    person: "Sofía Méndez",
    plane: "CC-KAA",
    model: "Cessna 172",
    status: "confirmed",
    mine: false,
    tone: "coral",
  },
  {
    id: 5,
    time: "15:00",
    end: "16:30",
    title: "Vuelo de instrucción",
    person: "Mateo Rojas",
    plane: "CC-KAD",
    model: "Diamond DA40",
    status: "confirmed",
    mine: true,
    tone: "teal",
  },
];

const aircraft = [
  {
    registration: "CC-KAA",
    model: "Cessna 172S",
    status: "Disponible",
    statusKey: "available",
    hours: "1.240 h",
    next: "Inspección en 18 h",
  },
  {
    registration: "CC-KAB",
    model: "Piper PA-28",
    status: "Mantenimiento",
    statusKey: "maintenance",
    hours: "982 h",
    next: "Hasta hoy, 18:00",
  },
  {
    registration: "CC-KAC",
    model: "Cessna 172R",
    status: "Disponible",
    statusKey: "available",
    hours: "1.108 h",
    next: "Inspección en 42 h",
  },
  {
    registration: "CC-KAD",
    model: "Diamond DA40",
    status: "Disponible",
    statusKey: "available",
    hours: "764 h",
    next: "Inspección en 27 h",
  },
];

const navItems = [
  { id: "overview", label: "Resumen", icon: LayoutDashboard },
  { id: "calendar", label: "Agenda", icon: CalendarDays },
  { id: "fleet", label: "Aeronaves", icon: Plane },
  { id: "history", label: "Historial", icon: History },
  { id: "audit", label: "Auditoría", icon: FileClock, adminOnly: true },
];

const api = {
  async login(username, password) {
    const csrfResponse = await fetch('/auth/csrf/', { credentials: 'include' });
    const { csrfToken } = await csrfResponse.json();
    const response = await fetch('/auth/login/', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No se pudo iniciar sesión.');
    return data;
  },
  async logout() {
    const csrfResponse = await fetch('/auth/csrf/', { credentials: 'include' });
    const { csrfToken } = await csrfResponse.json();
    const response = await fetch('/auth/logout/', {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRFToken': csrfToken },
    });
    if (!response.ok) throw new Error('No se pudo cerrar la sesión.');
  },
  async createReservation(payload) {
    const response = await fetch("/reservas/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken") || "",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "No se pudo crear la reserva.");
    }
    return response.json();
  },
};

const roleLabels = {
  ALUMNO: "Alumno",
  INSTRUCTOR: "Instructor",
  ADMIN: "Administrador",
};

function displayName(user) {
  return user?.username || "Invitado";
}

function initials(user) {
  const name = displayName(user);
  return name.slice(0, 2).toUpperCase();
}

function roleLabel(user) {
  return roleLabels[user?.rol] || "Alumno";
}

function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

function App() {
  const usingApi = import.meta.env.VITE_USE_API === "true";
  const [authenticated, setAuthenticated] = useState(!usingApi);
  const [currentUser, setCurrentUser] = useState(
    usingApi ? null : { username: "Mateo Rojas", rol: "ALUMNO" }
  );
  const [activeView, setActiveView] = useState("overview");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showReservation, setShowReservation] = useState(false);
  const [notice, setNotice] = useState(null);
  const [filter, setFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 8, 30));
  const [utilityModal, setUtilityModal] = useState(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogin = async (username, password) => {
    try {
      if (usingApi) {
        const user = await api.login(username, password);
        setCurrentUser(user);
      } else {
        setCurrentUser({ username, rol: "ALUMNO" });
      }
      setAuthenticated(true);
      setNotice({ type: "success", title: "Sesión iniciada", message: "Bienvenido nuevamente a AeroReserva." });
    } catch (error) {
      setNotice({ type: "error", title: "No se pudo ingresar", message: error.message });
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      if (usingApi) await api.logout();
      setUtilityModal(null);
      setAuthenticated(false);
      setCurrentUser(null);
    } catch (error) {
      setNotice({ type: "error", title: "No se pudo cerrar la sesión", message: error.message });
    }
  };

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const changeDate = (amount) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + amount);
    setSelectedDate(next);
  };

  const handleReservation = async (payload) => {
    try {
      if (import.meta.env.VITE_USE_API === "true")
        await api.createReservation(toApiReservation(payload));
      setNotice({
        type: "success",
        title: "Reserva confirmada",
        message: "La franja quedó registrada en la agenda.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        title: "No se pudo confirmar",
        message: error.message,
      });
    } finally {
      setShowReservation(false);
    }
  };

  const handleAction = (action) => {
    const actions = {
      support: {
        title: "Centro de operaciones",
        body: "Soporte disponible de lunes a viernes, 08:00–18:00. Contacto: operaciones@aeroreserva.local",
      },
      preferences: {
        title: "Preferencias",
        body: "Zona horaria: America/Santiago · Recordatorios internos: activos · Sesión: 30 minutos de inactividad.",
      },
      details: {
        title: "Detalle de operación",
        body: "CC-KAA · 07:30–09:00 · Vuelo de instrucción · Instructor asignado.",
      },
      refresh: {
        title: "Actividad actualizada",
        body: "La información visible fue sincronizada con la última consulta.",
      },
      filter: {
        title: "Filtros de recursos",
        body: "Puedes filtrar por disponibilidad, mantenimiento o próximas inspecciones.",
      },
      aircraft: {
        title: "Nueva aeronave",
        body: "El alta de aeronaves requiere permisos administrativos y se completará desde el catálogo de recursos.",
      },
      row: {
        title: "Registro seleccionado",
        body: "Aquí se mostrarán los valores completos, permisos disponibles y trazabilidad del registro.",
      },
    };
    setUtilityModal(actions[action] || actions.row);
  };

  const downloadCalendar = () => {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//AeroReserva//Agenda//ES",
      ...reservations.filter((item) => item.mine).flatMap((item, index) => [
        "BEGIN:VEVENT",
        `UID:aeroreserva-${item.id}@aeroreserva.local`,
        `SUMMARY:${item.title} - ${item.plane}`,
        `DTSTART:20260930T${item.time.replace(":", "")}00`,
        `DTEND:20260930T${item.end.replace(":", "")}00`,
        `SEQUENCE:${index}`,
        "END:VEVENT",
      ]),
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([lines], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "aeroreserva-calendario.ics";
    link.click();
    URL.revokeObjectURL(url);
    setNotice({ type: "success", title: "Calendario exportado", message: "Se descargó tu archivo .ics." });
  };

  function toApiReservation(form) {
    const start = new Date(`${form.date}T${form.start}:00-03:00`);
    const end = new Date(start.getTime() + Number(form.duration) * 60 * 1000);
    return {
      alumno_id: currentUser?.id || import.meta.env.VITE_CURRENT_USER_ID,
      instructor_id: import.meta.env.VITE_INSTRUCTOR_ID,
      aeronave_id: import.meta.env.VITE_AIRCRAFT_ID,
      inicio: start.toISOString(),
      fin: end.toISOString(),
      observacion: form.notes,
      recordatorio: form.reminder,
      clave_solicitud: form.claveSolicitud,
    };
  }

  const currentNav = navItems.find((item) => item.id === activeView);
  if (!authenticated) return <LoginScreen onLogin={handleLogin} />;
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark">
            <AirVent size={22} strokeWidth={2.3} />
          </div>
          <div>
            <strong>AeroReserva</strong>
            <span>flight operations</span>
          </div>
        </div>
        <div className="workspace-label">
          OPERACIONES <span>● en vivo</span>
        </div>
        <nav className="main-nav" aria-label="Navegación principal">
          {navItems.map(({ id, label, icon: Icon, adminOnly }) => (
            <button
              key={id}
              className={`nav-item ${activeView === id ? "active" : ""}`}
              onClick={() => {
                setActiveView(id);
                setMobileMenu(false);
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {adminOnly && <span className="nav-badge">A</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => handleAction("preferences")}>
            <Settings2 size={18} />
            <span>Preferencias</span>
          </button>
          <button className="support-card" onClick={() => handleAction("support")}>
            <CircleHelp size={17} />
            <div>
              <strong>¿Necesitas ayuda?</strong>
              <span>Centro de operaciones</span>
            </div>
            <ArrowRight size={16} />
          </button>
          <button className="user-mini" onClick={() => setUtilityModal({ title: "Perfil de usuario", body: `${displayName(currentUser)} · ${roleLabel(currentUser)} · Cuenta activa. Las habilitaciones vigentes se consultan desde el perfil.`, profile: true })}>
            <div className="avatar avatar-small">{initials(currentUser)}</div>
            <div>
              <strong>{displayName(currentUser)}</strong>
              <span>{roleLabel(currentUser)} · activo</span>
            </div>
            <ChevronDown size={15} />
          </button>
        </div>
      </aside>
      {mobileMenu && (
        <button
          className="scrim"
          aria-label="Cerrar menú"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <main className="main-content">
        <header className="topbar">
          <button
            className="icon-button menu-button"
            aria-label="Abrir menú"
            onClick={() => setMobileMenu(true)}
          >
            <Menu size={21} />
          </button>
          <div className="breadcrumb">
            <span>Operaciones</span>
            <ChevronRight size={14} />
            <strong>{currentNav?.label || "Resumen"}</strong>
          </div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Buscar" onClick={() => setSearchOpen(true)}>
              <Search size={18} />
            </button>
            <button
              className="icon-button notification-button"
              aria-label="Notificaciones"
              onClick={() => setNotificationOpen((current) => !current)}
            >
              <Bell size={18} />
              <i />
            </button>
            <button className="avatar avatar-button" onClick={() => setUtilityModal({ title: "Perfil de usuario", body: `${displayName(currentUser)} · ${roleLabel(currentUser)} · Cuenta activa. Las habilitaciones vigentes se consultan desde el perfil.`, profile: true })} aria-label="Abrir perfil de usuario">{initials(currentUser)}</button>
          </div>
          {notificationOpen && <NotificationPopover onClose={() => setNotificationOpen(false)} />}
        </header>

        <div className="page-wrap">
          {activeView === "overview" && (
            <Overview
              onNewReservation={() => setShowReservation(true)}
              filter={filter}
              setFilter={setFilter}
              selectedDate={selectedDate}
              changeDate={changeDate}
              onAction={handleAction}
              currentUser={currentUser}
            />
          )}
          {activeView === "calendar" && (
            <CalendarView
              onNewReservation={() => setShowReservation(true)}
              selectedDate={selectedDate}
              changeDate={changeDate}
              filter={filter}
              setFilter={setFilter}
            />
          )}
          {activeView === "fleet" && <FleetView onAction={handleAction} />}
          {activeView === "history" && <HistoryView onExport={downloadCalendar} onAction={handleAction} />}
          {activeView === "audit" && <AuditView onAction={handleAction} />}
        </div>
      </main>

      {showReservation && (
        <ReservationModal
          onClose={() => setShowReservation(false)}
          onSubmit={handleReservation}
          currentUser={currentUser}
        />
      )}
      {notice && (
        <div className={`toast toast-${notice.type}`} role="status">
          <div className="toast-icon">
            {notice.type === "success" ? (
              <Check size={17} />
            ) : (
              <AlertTriangle size={17} />
            )}
          </div>
          <div>
            <strong>{notice.title}</strong>
            <span>{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} aria-label="Cerrar aviso">
            <X size={16} />
          </button>
        </div>
      )}
      {utilityModal && <UtilityModal {...utilityModal} onClose={() => setUtilityModal(null)} onLogout={handleLogout} />}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} onNavigate={setActiveView} />}
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function Overview({
  onNewReservation,
  filter,
  setFilter,
  selectedDate,
  changeDate,
  onAction,
  currentUser,
}) {
  const firstName = displayName(currentUser).split(" ")[0];
  return (
    <>
      <PageHeader
        eyebrow="Mi operación · miércoles 30 septiembre 2026"
        title={`Buenos días, ${firstName}`}
        description="Tu jornada de vuelo está despejada. Revisa tus franjas y prepara la próxima salida."
        action={
          <button className="primary-button" onClick={onNewReservation}>
            <Plus size={18} /> Nueva reserva
          </button>
        }
      />
      <section className="metric-grid" aria-label="Resumen de actividad">
        <MetricCard
          icon={CalendarDays}
          label="Reservas activas"
          value="02"
          detail="Esta semana"
          accent="teal"
        />
        <MetricCard
          icon={Clock3}
          label="Horas de vuelo"
          value="06.5"
          detail="Este mes · +12%"
          accent="coral"
        />
        <MetricCard
          icon={ShieldCheck}
          label="Habilitación"
          value="Vigente"
          detail="Cessna 172 · 19 días"
          accent="lime"
        />
        <MetricCard
          icon={Activity}
          label="Estado operativo"
          value="Listo"
          detail="3 aeronaves disponibles"
          accent="blue"
        />
      </section>
      <section className="dashboard-grid">
        <CalendarCard
          filter={filter}
          setFilter={setFilter}
          selectedDate={selectedDate}
          changeDate={changeDate}
        />
        <div className="right-rail">
          <NextFlight onAction={onAction} />
          <OperationsCard />
        </div>
      </section>
      <section className="lower-grid">
        <FleetSnapshot onAction={onAction} />
        <ActivityFeed onAction={onAction} />
      </section>
    </>
  );
}

function MetricCard({ icon: Icon, label, value, detail, accent }) {
  return (
    <article className={`metric-card accent-${accent}`}>
      <div className="metric-top">
        <div className="metric-icon">
          <Icon size={18} />
        </div>
        <span className="metric-trend">
          <ArrowRight size={13} />
        </span>
      </div>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <span className="metric-detail">{detail}</span>
    </article>
  );
}

function DateToolbar({ selectedDate, changeDate, filter, setFilter }) {
  const [viewMode, setViewMode] = useState("week");
  const formatted = selectedDate
    .toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
    .replace(".", "");
  return (
    <div className="calendar-toolbar">
      <div className="date-control">
        <button
          className="icon-button small"
          aria-label="Día anterior"
          onClick={() => changeDate(-1)}
        >
          <ChevronLeft size={16} />
        </button>
        <strong>{formatted}</strong>
        <button
          className="icon-button small"
          aria-label="Día siguiente"
          onClick={() => changeDate(1)}
        >
          <ChevronRight size={16} />
        </button>
        <button className="today-button" onClick={() => changeDate(0)}>
          Hoy
        </button>
      </div>
      <div className="filter-group">
        <Filter size={15} />
        <select
          aria-label="Filtrar agenda"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">Todas las franjas</option>
          <option value="mine">Mis reservas</option>
          <option value="available">Disponibles</option>
        </select>
        <button className={`view-toggle ${viewMode === "week" ? "active" : ""}`} aria-label="Vista semanal" aria-pressed={viewMode === "week"} onClick={() => setViewMode("week")}>
          <Grid2X2 size={15} />
        </button>
        <button className={`view-toggle ${viewMode === "day" ? "active" : ""}`} aria-label="Vista diaria" aria-pressed={viewMode === "day"} onClick={() => setViewMode("day")}>
          <CalendarDays size={15} />
        </button>
      </div>
    </div>
  );
}

function CalendarCard({
  filter,
  setFilter,
  selectedDate,
  changeDate,
  full = false,
}) {
  const visibleReservations = reservations.filter((item) =>
    filter === "mine" ? item.mine : true,
  );
  return (
    <article
      className={`glass-card calendar-card ${full ? "calendar-full" : ""}`}
    >
      <div className="card-heading">
        <div>
          <span className="card-kicker">AGENDA DE VUELO</span>
          <h2>Miércoles, 30 septiembre</h2>
        </div>
        <span className="live-status">
          <i /> Actualizada ahora
        </span>
      </div>
      <DateToolbar
        selectedDate={selectedDate}
        changeDate={changeDate}
        filter={filter}
        setFilter={setFilter}
      />
      <div className="calendar-grid">
        <div className="time-column">
          {["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00"].map(
            (time) => (
              <span key={time}>{time}</span>
            ),
          )}
        </div>
        <div className="schedule-column">
          <div className="now-line" style={{ top: "31%" }}>
            <i /> Ahora
          </div>
          {visibleReservations.map((item) => (
            <ReservationBlock key={item.id} item={item} />
          ))}
        </div>
      </div>
      <div className="calendar-legend">
        <span>
          <i className="dot dot-teal" /> Mi reserva
        </span>
        <span>
          <i className="dot dot-slate" /> Ocupado
        </span>
        <span>
          <i className="dot dot-amber" /> Bloqueo
        </span>
        <span>
          <i className="dot dot-outline" /> Disponible
        </span>
      </div>
    </article>
  );
}

function ReservationBlock({ item }) {
  const top = `${(parseInt(item.time, 10) - 6) * 16.6 + (parseInt(item.time.slice(3), 10) / 60) * 16.6}%`;
  const height = `${(parseInt(item.end, 10) + parseInt(item.end.slice(3), 10) / 60 - (parseInt(item.time, 10) + parseInt(item.time.slice(3), 10) / 60)) * 16.6}%`;
  return (
    <div
      className={`reservation-block block-${item.tone}`}
      style={{ top, height }}
    >
      <div className="block-time">
        {item.time} — {item.end}
      </div>
      <strong>{item.title}</strong>
      <span>
        {item.status === "busy" ? "Datos protegidos" : item.person} ·{" "}
        {item.plane}
      </span>
      {item.status === "blocked" && <AlertTriangle size={14} />}
    </div>
  );
}

function NextFlight({ onAction }) {
  return (
    <article className="glass-card next-flight">
      <div className="card-heading">
        <div>
          <span className="card-kicker">PRÓXIMO VUELO</span>
          <h2>En 01h 42m</h2>
        </div>
        <div className="weather">
          <CloudSun size={19} />
          <strong>18°</strong>
        </div>
      </div>
      <div className="flight-route">
        <div className="route-point">
          <span>CC-KAA</span>
          <strong>07:30</strong>
          <small>Hangar 02</small>
        </div>
        <div className="route-line">
          <Plane size={17} />
          <i />
        </div>
        <div className="route-point align-right">
          <span>CC-KAA</span>
          <strong>09:00</strong>
          <small>Vuelo local</small>
        </div>
      </div>
      <div className="flight-meta">
        <span>
          <UserRound size={14} /> Mateo Rojas
        </span>
        <span>
          <ShieldCheck size={14} /> Instructor asignado
        </span>
      </div>
      <button className="subtle-button" onClick={() => onAction("details")}>
        Ver detalles <ArrowRight size={15} />
      </button>
    </article>
  );
}

function OperationsCard() {
  return (
    <article className="glass-card operations-card">
      <div className="card-heading">
        <div>
          <span className="card-kicker">OPERACIÓN</span>
          <h2>Todo en orden</h2>
        </div>
        <span className="status-icon success">
          <Check size={17} />
        </span>
      </div>
      <div className="operation-row">
        <span>Disponibilidad de flota</span>
        <strong>3 / 4</strong>
        <div className="progress">
          <i style={{ width: "75%" }} />
        </div>
      </div>
      <div className="operation-row">
        <span>Instructores activos</span>
        <strong>08</strong>
        <div className="progress coral">
          <i style={{ width: "62%" }} />
        </div>
      </div>
      <div className="operation-row">
        <span>Próxima inspección</span>
        <strong>18 h</strong>
        <div className="progress lime">
          <i style={{ width: "38%" }} />
        </div>
      </div>
    </article>
  );
}

function FleetSnapshot({ onAction }) {
  return (
    <article className="glass-card list-card">
      <div className="card-heading">
        <div>
          <span className="card-kicker">FLOTA</span>
          <h2>Aeronaves disponibles</h2>
        </div>
        <button className="text-button" onClick={() => onAction("row")}>
          Ver todas <ArrowRight size={14} />
        </button>
      </div>
      <div className="fleet-list">
        {aircraft.slice(0, 3).map((plane) => (
          <div className="fleet-row" key={plane.registration}>
            <div className="plane-thumb">
              <Plane size={17} />
            </div>
            <div className="fleet-name">
              <strong>{plane.registration}</strong>
              <span>{plane.model}</span>
            </div>
            <div className={`status-pill ${plane.statusKey}`}>
              <i /> {plane.status}
            </div>
            <span className="fleet-hours">{plane.hours}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function ActivityFeed({ onAction }) {
  return (
    <article className="glass-card list-card">
      <div className="card-heading">
        <div>
          <span className="card-kicker">ACTIVIDAD RECIENTE</span>
          <h2>Últimos movimientos</h2>
        </div>
        <button className="icon-button small" aria-label="Actualizar actividad" onClick={() => onAction("refresh")}>
          <RefreshCw size={15} />
        </button>
      </div>
      <div className="activity-list">
        <div className="activity-row">
          <div className="activity-dot teal">
            <Check size={13} />
          </div>
          <div>
            <strong>Reserva confirmada</strong>
            <span>CC-KAA · hoy, 07:18</span>
          </div>
          <time>hace 12 min</time>
        </div>
        <div className="activity-row">
          <div className="activity-dot amber">
            <AlertTriangle size={13} />
          </div>
          <div>
            <strong>Aeronave bloqueada</strong>
            <span>CC-KAB · mantenimiento</span>
          </div>
          <time>hace 1 h</time>
        </div>
        <div className="activity-row">
          <div className="activity-dot coral">
            <Bell size={13} />
          </div>
          <div>
            <strong>Recordatorio programado</strong>
            <span>Vuelo de mañana · 07:30</span>
          </div>
          <time>ayer</time>
        </div>
      </div>
    </article>
  );
}

function CalendarView({
  onNewReservation,
  selectedDate,
  changeDate,
  filter,
  setFilter,
}) {
  return (
    <>
      <PageHeader
        eyebrow="Planificación de vuelos"
        title="Agenda operativa"
        description="Consulta disponibilidad sin exponer información privada de otros pilotos."
        action={
          <button className="primary-button" onClick={onNewReservation}>
            <Plus size={18} /> Nueva reserva
          </button>
        }
      />
      <CalendarCard
        full
        filter={filter}
        setFilter={setFilter}
        selectedDate={selectedDate}
        changeDate={changeDate}
      />
    </>
  );
}

function FleetView({ onAction }) {
  return (
    <>
      <PageHeader
        eyebrow="Recursos · 04 aeronaves"
        title="Catálogo de aeronaves"
        description="Disponibilidad, ciclos de mantenimiento y próximos hitos de inspección."
        action={
          <button className="secondary-button" onClick={() => onAction("aircraft")}>
            <Plus size={17} /> Añadir aeronave
          </button>
        }
      />
      <div className="fleet-table glass-card">
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={16} />
            <input placeholder="Buscar matrícula o modelo" />
          </div>
          <button className="secondary-button compact" onClick={() => onAction("filter")}>
            <Filter size={15} /> Filtrar
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Aeronave</th>
                <th>Estado</th>
                <th>Horas totales</th>
                <th>Próxima acción</th>
                <th>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {aircraft.map((plane) => (
                <tr key={plane.registration}>
                  <td>
                    <div className="table-aircraft">
                      <div className="plane-thumb">
                        <Plane size={17} />
                      </div>
                      <div>
                        <strong>{plane.registration}</strong>
                        <span>{plane.model}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${plane.statusKey}`}>
                      <i /> {plane.status}
                    </span>
                  </td>
                  <td>{plane.hours}</td>
                  <td>
                    <span className="next-action">
                      <AlarmClock size={14} /> {plane.next}
                    </span>
                  </td>
                  <td>
                    <button
                      className="icon-button small"
                      aria-label={`Abrir ${plane.registration}`}
                      onClick={() => onAction("row")}
                    >
                      <ArrowRight size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function HistoryView({ onExport, onAction }) {
  return (
    <>
      <PageHeader
        eyebrow="Trazabilidad personal"
        title="Historial de reservas"
        description="Revisa tus vuelos confirmados, cancelados y horas acumuladas."
        action={
          <button className="secondary-button" onClick={onExport}>
            <Download size={17} /> Exportar .ics
          </button>
        }
      />
      <div className="history-summary">
        <MetricCard
          icon={CalendarDays}
          label="Vuelos completados"
          value="24"
          detail="Desde enero 2026"
          accent="teal"
        />
        <MetricCard
          icon={Clock3}
          label="Horas acumuladas"
          value="38.5"
          detail="+4.2 este mes"
          accent="coral"
        />
        <MetricCard
          icon={BarChart3}
          label="Tasa de asistencia"
          value="96%"
          detail="Excelente"
          accent="lime"
        />
      </div>
      <div className="history-list glass-card">
        <div className="card-heading">
          <div>
            <span className="card-kicker">REGISTRO</span>
            <h2>Vuelos recientes</h2>
          </div>
          <button className="secondary-button compact" onClick={() => onAction("filter")}>
            <Filter size={15} /> Filtrar
          </button>
        </div>
        {[
          [
            "30 sep",
            "CC-KAA",
            "Cessna 172S",
            "07:30 — 09:00",
            "Confirmada",
            "teal",
          ],
          [
            "26 sep",
            "CC-KAD",
            "Diamond DA40",
            "15:00 — 16:30",
            "Confirmada",
            "teal",
          ],
          [
            "21 sep",
            "CC-KAA",
            "Cessna 172S",
            "10:00 — 11:30",
            "Cancelada",
            "coral",
          ],
          [
            "18 sep",
            "CC-KAC",
            "Cessna 172R",
            "08:00 — 09:30",
            "Confirmada",
            "teal",
          ],
        ].map(([date, reg, model, time, status, color]) => (
          <div className="history-row" key={`${date}-${reg}`}>
            <span className="history-date">
              {date}
              <small>2026</small>
            </span>
            <div className="plane-thumb">
              <Plane size={16} />
            </div>
            <div className="history-main">
              <strong>
                {reg} · {model}
              </strong>
              <span>{time} · Vuelo local</span>
            </div>
            <span
              className={`status-pill ${color === "teal" ? "available" : "cancelled"}`}
            >
              <i /> {status}
            </span>
                  <button className="icon-button small" aria-label="Ver reserva" onClick={() => onAction("details")}>
              <ArrowRight size={15} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function AuditView({ onAction }) {
  return (
    <>
      <PageHeader
        eyebrow="Control administrativo"
        title="Registro de auditoría"
        description="Actividad completa del sistema, con valores y responsables de cada cambio."
        action={
          <button className="secondary-button" onClick={() => onAction("row")}>
            <Download size={17} /> Exportar registro
          </button>
        }
      />
      <div className="audit-banner">
        <div className="status-icon success">
          <ShieldCheck size={18} />
        </div>
        <div>
          <strong>Registro íntegro y protegido</strong>
          <span>
            Los eventos se almacenan de forma inmutable con fecha y usuario.
          </span>
        </div>
        <span className="live-status">
          <i /> Sincronizado
        </span>
      </div>
      <div className="audit-table glass-card">
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={16} />
            <input placeholder="Buscar entidad, usuario o acción" />
          </div>
          <button className="secondary-button compact" onClick={() => onAction("filter")}>
            <Filter size={15} /> Todos los eventos
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Usuario</th>
                <th>Entidad</th>
                <th>Instante</th>
                <th>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="event-action success-text">
                    <Check size={14} /> CREACIÓN
                  </span>
                </td>
                <td>Mateo Rojas</td>
                <td>Reserva · CC-KAA</td>
                <td>30 sep 2026 · 07:18</td>
                <td>
                  <button className="icon-button small" aria-label="Ver evento de creación" onClick={() => onAction("row")}>
                    <ArrowRight size={15} />
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="event-action warning-text">
                    <AlertTriangle size={14} /> BLOQUEO
                  </span>
                </td>
                <td>Laura Campos</td>
                <td>Aeronave · CC-KAB</td>
                <td>30 sep 2026 · 06:42</td>
                <td>
                  <button className="icon-button small" aria-label="Ver evento de bloqueo" onClick={() => onAction("row")}>
                    <ArrowRight size={15} />
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="event-action coral-text">
                    <X size={14} /> CANCELACIÓN
                  </span>
                </td>
                <td>Sofía Méndez</td>
                <td>Reserva · CC-KAA</td>
                <td>21 sep 2026 · 09:02</td>
                <td>
                  <button className="icon-button small" aria-label="Ver evento de cancelación" onClick={() => onAction("row")}>
                    <ArrowRight size={15} />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function LoginScreen({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await onLogin(form.username, form.password);
    } catch (loginError) {
      setError(loginError.message);
    }
  };
  return (
    <main className="login-shell">
      <section className="login-card glass-card" aria-labelledby="login-title">
        <div className="brand-mark"><AirVent size={23} /></div>
        <span className="card-kicker">AERORESERVA</span>
        <h1 id="login-title">Iniciar sesión</h1>
        <p>Accede a tu agenda de vuelos y recursos operativos.</p>
        <form onSubmit={submit}>
          <label>Usuario<input autoComplete="username" required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label>
          <label>Contraseña<input type="password" autoComplete="current-password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          {error && <div className="login-error" role="alert"><AlertTriangle size={15} /> {error}</div>}
          <button className="primary-button login-submit" type="submit"><ShieldCheck size={17} /> Entrar de forma segura</button>
        </form>
      </section>
    </main>
  );
}

function NotificationPopover({ onClose }) {
  return (
    <aside className="notification-popover" aria-label="Notificaciones">
      <div className="popover-heading">
        <strong>Notificaciones</strong>
        <button className="icon-button small" onClick={onClose} aria-label="Cerrar notificaciones">
          <X size={15} />
        </button>
      </div>
      <button className="notification-item" onClick={onClose}>
        <span className="activity-dot teal"><Check size={13} /></span>
        <span><strong>Reserva confirmada</strong><small>CC-KAA · hace 12 min</small></span>
      </button>
      <button className="notification-item" onClick={onClose}>
        <span className="activity-dot amber"><AlertTriangle size={13} /></span>
        <span><strong>Bloqueo de mantenimiento</strong><small>CC-KAB · hace 1 h</small></span>
      </button>
      <button className="text-button popover-link" onClick={onClose}>Marcar como revisadas</button>
    </aside>
  );
}

function UtilityModal({ title, body, profile = false, onClose, onLogout }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="utility-modal glass-card" role="dialog" aria-modal="true" aria-labelledby="utility-title">
        <div className="modal-header">
          <div><span className="card-kicker">AERORESERVA</span><h2 id="utility-title">{title}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar ventana"><X size={19} /></button>
        </div>
        <p className="utility-body">{body}</p>
        <div className="utility-actions">
          {profile && <button className="logout-button" onClick={onLogout}><LogOut size={16} /> Cerrar sesión</button>}
          <button className="primary-button" onClick={onClose}><Check size={17} /> Entendido</button>
        </div>
      </section>
    </div>
  );
}

function SearchOverlay({ onClose, onNavigate }) {
  const [query, setQuery] = useState("");
  const results = navItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="search-modal glass-card" role="dialog" aria-modal="true" aria-labelledby="search-title">
        <div className="modal-header">
          <div><span className="card-kicker">NAVEGACIÓN RÁPIDA</span><h2 id="search-title">Buscar en AeroReserva</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar búsqueda"><X size={19} /></button>
        </div>
        <div className="search-field search-modal-field"><Search size={16} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busca un módulo..." /></div>
        <div className="search-results">{results.map(({ id, label, icon: Icon }) => <button key={id} className="search-result" onClick={() => { onNavigate(id); onClose(); }}><Icon size={17} /><span>{label}</span><ArrowRight size={15} /></button>)}{results.length === 0 && <p className="empty-search">No hay módulos que coincidan.</p>}</div>
      </section>
    </div>
  );
}

function ReservationModal({ onClose, onSubmit, currentUser }) {
  const [form, setForm] = useState({
    plane: "CC-KAA",
    instructor: "Laura Campos",
    date: "2026-10-01",
    start: "07:30",
    duration: "90",
    notes: "",
    reminder: true,
  });
  const update = (field) => (event) =>
    setForm((current) => ({
      ...current,
      [field]:
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value,
    }));
  const submit = (event) => {
    event.preventDefault();
    onSubmit({ ...form, claveSolicitud: crypto.randomUUID() });
  };
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="modal glass-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-title"
      >
        <div className="modal-header">
          <div>
            <span className="card-kicker">NUEVA OPERACIÓN</span>
            <h2 id="reservation-title">Crear reserva</h2>
            <p>Elige una franja libre para tu próximo vuelo.</p>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Cerrar formulario"
          >
            <X size={19} />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label>
              Alumno titular
              <input value={displayName(currentUser)} disabled />
            </label>
            <label>
              Aeronave
              <select value={form.plane} onChange={update("plane")}>
                <option>CC-KAA</option>
                <option>CC-KAC</option>
                <option>CC-KAD</option>
              </select>
            </label>
            <label>
              Instructor
              <select value={form.instructor} onChange={update("instructor")}>
                <option>Laura Campos</option>
                <option>Andrés Vidal</option>
                <option>María Silva</option>
              </select>
            </label>
            <label>
              Fecha
              <input type="date" value={form.date} onChange={update("date")} />
            </label>
            <label>
              Inicio
              <select value={form.start} onChange={update("start")}>
                <option>07:30</option>
                <option>09:30</option>
                <option>12:30</option>
                <option>15:00</option>
              </select>
            </label>
            <label>
              Duración
              <select value={form.duration} onChange={update("duration")}>
                <option value="30">30 minutos</option>
                <option value="60">60 minutos</option>
                <option value="90">90 minutos</option>
                <option value="120">120 minutos</option>
                <option value="180">180 minutos</option>
              </select>
            </label>
          </div>
          <label>
            Observaciones <span className="optional">opcional</span>
            <textarea
              maxLength="500"
              value={form.notes}
              onChange={update("notes")}
              placeholder="Añade una nota para el instructor..."
            />
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={form.reminder}
              onChange={update("reminder")}
            />
            <span className="fake-check">
              <Check size={13} />
            </span>
              <span>
                Programar recordatorio interno{" "}
                <small>30 minutos antes del vuelo</small>
              </span>
          </label>
          <div className="modal-foot">
            <span className="idempotency-note">
              <ShieldCheck size={14} /> Solicitud protegida contra duplicados
            </span>
            <div>
              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button type="submit" className="primary-button">
                <Check size={17} /> Confirmar reserva
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
