import { useState, useEffect } from 'react'

type NoteCategory = 'development' | 'issue' | 'info' | 'todo'

interface Note {
  id: string
  title: string
  content: string
  category: NoteCategory
  date: string
  status: 'active' | 'completed'
}

const CATEGORIES: { id: NoteCategory; label: string; icon: any; color: string }[] = [
  { 
    id: 'development', 
    label: 'Geliştirme', 
    color: 'text-purple-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3M3.343 19.657l.707-.707m16.536-.707l-.707.707M6.343 4.636l.707.707M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"/></svg>
    )
  },
  { 
    id: 'issue', 
    label: 'Sorun', 
    color: 'text-red-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    )
  },
  { 
    id: 'info', 
    label: 'Bilgi', 
    color: 'text-blue-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
    )
  },
  { 
    id: 'todo', 
    label: 'Yapılacak', 
    color: 'text-green-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
    )
  }
]

export default function DeveloperNotes() {
  const [isOpen, setIsOpen] = useState(true)
  const [notes, setNotes] = useState<Note[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('developerNotes')
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes))
    } else {
      // Default note
      const defaultNote: Note = {
        id: '1',
        title: 'Maç Kayıtları',
        content: 'Burada kayıt alırken sistemde halihazırda bir kayıt var ise durdurmayın tekrar bir kayıt alma süreci yok ise ve oynanılan bir maç var ise her iki sahadan bir tanesinde kayıt alabilirsiniz drive(buluta tıklamadan önce) videoları izleyin herhangi bir problem oluşmaması için ve video başarılı bir şekilde yüklendi diyene kadar yükleme esnasında sayfadan çıkış yapmayınız!!! EN ÖNEMLİSİ İSE ANA AKIŞTAN KAYIT ALIN!!!!',
        category: 'todo',
        date: new Date().toISOString(),
        status: 'active'
      }
      setNotes([defaultNote])
      localStorage.setItem('developerNotes', JSON.stringify([defaultNote]))
    }
  }, [])

  const saveNotes = (newNotes: Note[]) => {
    setNotes(newNotes)
    localStorage.setItem('developerNotes', JSON.stringify(newNotes))
  }

  const handleAddNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: '',
      content: '',
      category: 'info',
      date: new Date().toISOString(),
      status: 'active'
    }
    setEditingNote(newNote)
    setIsEditing(true)
    setIsDropdownOpen(false)
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setIsEditing(true)
    setIsDropdownOpen(false)
  }

  const handleDeleteNote = (id: string) => {
    if (confirm('Bu notu silmek istediğinize emin misiniz?')) {
      const newNotes = notes.filter(n => n.id !== id)
      saveNotes(newNotes)
    }
  }

  const handleSaveEdit = () => {
    if (!editingNote || !editingNote.title || !editingNote.content) return

    const existingIndex = notes.findIndex(n => n.id === editingNote.id)
    let newNotes
    if (existingIndex >= 0) {
      newNotes = [...notes]
      newNotes[existingIndex] = { ...editingNote, date: new Date().toISOString() }
    } else {
      newNotes = [editingNote, ...notes]
    }
    
    saveNotes(newNotes)
    setIsEditing(false)
    setEditingNote(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategory = (id: string) => CATEGORIES.find(c => c.id === id) || CATEGORIES[2]

  return (
    <div className="mt-8">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-300 hover:text-white mb-4 font-medium w-full"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <line x1="10" y1="9" x2="8" y2="9"/>
        </svg>
        Geliştirici Notları
        <span className="bg-gray-700 text-xs px-2 py-0.5 rounded-full text-gray-300">{notes.length}</span>
        <svg 
          className={`ml-auto transform transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {isOpen && (
        <div className="space-y-4">
          <p className="text-gray-500 text-sm">
            Kamera sistemine dair notlar, sorunlar ve iyileştirme önerileri
          </p>
          
          {notes.map(note => {
            const category = getCategory(note.category)
            return (
              <div key={note.id} className="bg-[#1a1f2e] border border-gray-800 rounded-lg p-4 relative group hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className={`flex items-center gap-2 font-medium ${category.color}`}>
                    {category.icon}
                    {note.title}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEditNote(note)}
                      className="text-gray-500 hover:text-white p-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-gray-500 hover:text-red-500 p-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <span className={`px-2 py-1 rounded ${
                    note.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-gray-800 text-gray-300'
                  }`}>
                    {note.status === 'completed' ? 'Tamamlandı' : 'Yapılacak'}
                  </span>
                  <span>{formatDate(note.date)}</span>
                </div>
              </div>
            )
          })}

          <div className="flex justify-end">
            <button 
              onClick={handleAddNote}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Not Ekle
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && editingNote && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6 w-full max-w-lg relative">
            <button 
              onClick={() => setIsEditing(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            <h3 className="text-xl font-bold text-white mb-6">Yeni Not Ekle</h3>
            
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Kategori</label>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2.5 text-white flex items-center justify-between hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {getCategory(editingNote.category).icon}
                    <span>{getCategory(editingNote.category).label}</span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f1117] border border-gray-700 rounded-lg shadow-xl z-10 overflow-hidden">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setEditingNote({...editingNote, category: cat.id})
                          setIsDropdownOpen(false)
                        }}
                        className="w-full px-3 py-2.5 flex items-center gap-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left"
                      >
                        {editingNote.category === cat.id && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                        <span className={editingNote.category === cat.id ? 'ml-0' : 'ml-5.5'}>
                          <span className="flex items-center gap-2">
                            {cat.icon}
                            {cat.label}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Başlık</label>
                <input 
                  type="text" 
                  value={editingNote.title}
                  onChange={e => setEditingNote({...editingNote, title: e.target.value})}
                  placeholder="Not başlığı"
                  className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">İçerik</label>
                <textarea 
                  value={editingNote.content}
                  onChange={e => setEditingNote({...editingNote, content: e.target.value})}
                  placeholder="Not içeriği..."
                  rows={4}
                  className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors border border-gray-700 rounded-lg hover:bg-gray-800"
              >
                İptal
              </button>
              <button 
                onClick={handleSaveEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
