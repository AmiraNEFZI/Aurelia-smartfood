import { useState } from 'react'
import { useNotifications } from '@/client/context/NotificationContext'

export function NotificationMenu() {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications()

  return (
    <div className="position-relative" style={{ zIndex: 1300 }}>
      <button
        type="button"
        className="btn border border-secondary rounded-circle bg-white position-relative"
        style={{ width: '40px', height: '40px' }}
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
      >
        <i className="fas fa-bell text-primary"></i>
        {unreadCount > 0 && (
          <span
            className="position-absolute bg-success rounded-circle d-flex align-items-center justify-content-center text-white"
            style={{ top: '-4px', right: '-4px', width: '20px', height: '20px', fontSize: '11px' }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="position-absolute end-0 p-3 shadow-lg rounded-3 bg-white"
          style={{
            minWidth: '320px',
            zIndex: 1400,
            right: 0,
            top: 'calc(100% + 0.5rem)',
            border: '1px solid rgba(0,0,0,0.08)',
            color: '#212529',
            overflow: 'visible',
          }}
        >
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h6 className="mb-0 text-dark">Notifications</h6>
              <small className="text-muted">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</small>
            </div>
            <button type="button" className="btn btn-sm btn-link text-decoration-none text-primary" onClick={markAllRead}>
              Tout marquer lu
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-4 text-muted">Aucune notification pour le moment.</div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {notifications.map(notification => (
                <button
                  key={notification.id}
                  type="button"
                  className={`text-start p-3 rounded-3 ${notification.read ? 'border border-secondary bg-white' : 'border border-primary bg-white'}`}
                  onClick={() => markAsRead(notification.id)}
                  style={{ cursor: 'pointer', transition: 'background-color 0.2s ease' }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <strong className="text-dark">{notification.title}</strong>
                    <small className="text-muted">{new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                  </div>
                  <p className="mb-0 text-dark" style={{ fontSize: '13px', lineHeight: 1.6 }}>
                    {notification.message}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
