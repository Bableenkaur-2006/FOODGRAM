import React, { useState, useRef } from 'react'
import '../../styles/create-food.css'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'

const CreateFood = () => {
    const navigate = useNavigate()
    const { id } = useParams() // optional food partner id

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

        const [dragging, setDragging] = useState(false)

            const fileInputRef = useRef(null)

            const handleFile = (eOrFile) => {
            let f = null
            if (!eOrFile) return
            if (eOrFile instanceof File) f = eOrFile
            else if (eOrFile.target && eOrFile.target.files) f = eOrFile.target.files[0]
            if (!f) return setFile(null)
            setFile(f)
            try {
                setPreview(URL.createObjectURL(f))
            } catch (err) {
                setPreview(null)
            }
        }

        const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
        const handleDragLeave = (e) => { e.preventDefault(); setDragging(false) }
        const handleDrop = (e) => {
            e.preventDefault(); setDragging(false)
            const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
            if (f) handleFile(f)
        }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        if (!name.trim()) return setError('Please enter a name')
        if (!file) return setError('Please select a video file')

        const fd = new FormData()
        fd.append('name', name)
        fd.append('description', description)
        fd.append('video', file)
        if (id) fd.append('foodPartner', id)

        setLoading(true)
        try {
            const res = await axios.post('http://localhost:3000/api/food', fd, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            console.log('created', res.data)
            navigate('/food-partner/profile/' + (id || ''))
        } catch (err) {
            console.error(err)
            setError(err?.response?.data?.message || err.message || 'Upload failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="create-food-page">
            <div className="create-card">
                <div className="create-header">
                    <h2>Create Food</h2>
                    <p>Add a name, description and upload a short video for this meal.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Meal name" />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description" />
                    </div>

                                <div className="form-group">
                                    <label htmlFor="video">Video</label>
                                    <div className="file-input">
                                                        <label
                                            htmlFor="video"
                                            className={`file-input-label ${dragging ? 'dragging' : ''}`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                        >
                                            {/* SVG upload icon */}
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                                <path d="M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <span className="file-name">{file ? file.name : 'Choose a video or drop it here'}</span>
                                            <span className="file-meta">{file ? (file.size / (1024*1024)).toFixed(2) + ' MB' : ''}</span>
                                        </label>
                                                        <input ref={fileInputRef} id="video" type="file" accept="video/*" onChange={handleFile} />
                                                        {file && (
                                                            <button
                                                                type="button"
                                                                className="file-remove"
                                                                onClick={() => {
                                                                    setFile(null)
                                                                    setPreview(null)
                                                                    if (fileInputRef.current) fileInputRef.current.value = ''
                                                                }}
                                                                aria-label="Remove selected file"
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                        {preview && (
                                            <div className="video-preview">
                                                <video src={preview} controls muted />
                                            </div>
                                        )}
                                    </div>
                                </div>

                    {error && <div className="note" style={{ color: 'var(--accent)', marginTop: 8 }}>{error}</div>}

                    <div className="actions">
                        <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
                        <button type="submit" className="btn">{loading ? 'Uploading...' : 'Create'}</button>
                    </div>

                    <p className="note">Tip: Use short videos (under 15 MB) for faster uploads.</p>
                </form>
            </div>
        </div>
    )
}

export default CreateFood