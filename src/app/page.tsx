'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Image from "next/image";
import { X, User, Sun, Eye } from 'lucide-react';

interface Tag {
  id: string;
  x: number;
  y: number;
  firstName: string;
  lastName: string;
  vinculo: string;
  yearIngreso: string;
}

export default function Home() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [vinculo, setVinculo] = useState('');
  const [yearIngreso, setYearIngreso] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [draggedTag, setDraggedTag] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [justFinishedDragging, setJustFinishedDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Check for view-only mode and admin mode from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewOnly = urlParams.get('photo') === '1803';
    const admin = urlParams.get('admin') === '1803';
    setIsViewOnly(viewOnly);
    setIsAdmin(admin);
  }, []);

  // Set client-side flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check for mobile device (only after client-side hydration)
  useEffect(() => {
    if (!isClient) return;

    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                            window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [isClient]);

  // Load tags from server on component mount
  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await fetch('/api/tags');
        const data = await response.json();
        if (data.success && data.tags) {
          setTags(data.tags);
        }
      } catch (error) {
        console.error('Error loading tags:', error);
      }
    };
    
    loadTags();
  }, []);

  // Save tags to server whenever tags change
  const saveTagsToServer = useCallback(async (tagsToSave: Tag[]) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags: tagsToSave }),
      });
      
      const data = await response.json();
      if (!data.success) {
        console.error('Failed to save tags:', data.error);
      }
    } catch (error) {
      console.error('Error saving tags:', error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleImageClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    // Don't allow adding tags in view-only mode or on mobile devices
    if (isViewOnly || isMobile) return;
    
    // Don't open modal if we just finished dragging
    if (justFinishedDragging) {
      setJustFinishedDragging(false);
      return;
    }
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    setClickPosition({ x, y });
    setShowModal(true);
  }, [justFinishedDragging, isViewOnly, isMobile]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName.trim() && lastName.trim() && vinculo) {
      setIsSubmitting(true);
      try {
        const newTag: Tag = {
          id: Date.now().toString(),
          x: clickPosition.x,
          y: clickPosition.y,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          vinculo: vinculo,
          yearIngreso: yearIngreso.trim() || 'No especificado',
        };
        const updatedTags = [...tags, newTag];
        setTags(updatedTags);
        await saveTagsToServer(updatedTags);
        setFirstName('');
        setLastName('');
        setVinculo('');
        setYearIngreso('');
        setShowModal(false);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [firstName, lastName, vinculo, yearIngreso, clickPosition, tags, saveTagsToServer]);

  const removeTag = useCallback(async (id: string) => {
    const updatedTags = tags.filter(tag => tag.id !== id);
    setTags(updatedTags);
    await saveTagsToServer(updatedTags);
  }, [tags, saveTagsToServer]);

  const startEditing = useCallback((tag: Tag) => {
    setEditingTag(tag.id);
    setFirstName(tag.firstName);
    setLastName(tag.lastName);
    setVinculo(tag.vinculo);
    setYearIngreso(tag.yearIngreso);
    setShowModal(true);
  }, []);

  const handleEditSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName.trim() && lastName.trim() && vinculo && editingTag) {
      setIsSubmitting(true);
      try {
        const updatedTags = tags.map(tag => 
          tag.id === editingTag 
            ? { ...tag, firstName: firstName.trim(), lastName: lastName.trim(), vinculo: vinculo, yearIngreso: yearIngreso.trim() || 'No especificado' }
            : tag
        );
        setTags(updatedTags);
        await saveTagsToServer(updatedTags);
        setFirstName('');
        setLastName('');
        setVinculo('');
        setYearIngreso('');
        setEditingTag(null);
        setShowModal(false);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [firstName, lastName, vinculo, yearIngreso, editingTag, tags, saveTagsToServer]);

  const downloadTags = useCallback(() => {
    if (tags.length === 0) {
      alert('No hay etiquetas para descargar');
      return;
    }

    const dataToExport = {
      metadata: {
        title: "Etiquetas de Pregrado Astronomía 2025",
        description: "Lista de personas etiquetadas en la foto de graduación",
        exportDate: new Date().toISOString(),
        totalTags: tags.length
      },
      tags: tags.map(tag => ({
        id: tag.id,
        nombres: tag.firstName,
        apellidos: tag.lastName,
        vinculo: tag.vinculo,
        añoIngreso: tag.yearIngreso,
        coordenadas: {
          x: tag.x,
          y: tag.y
        }
      }))
    };

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `etiquetas-pregrado-astronomia-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [tags]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      alert('Por favor seleccione un archivo JSON válido');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        // Validate the structure
        if (!jsonData.tags || !Array.isArray(jsonData.tags)) {
          alert('El archivo no tiene el formato correcto. Debe contener un array "tags"');
          return;
        }

        // Convert uploaded data to our tag format
        const uploadedTags: Tag[] = jsonData.tags.map((tag: any, index: number) => ({
          id: tag.id || `uploaded-${Date.now()}-${index}`,
          x: tag.coordenadas?.x || tag.x || 0,
          y: tag.coordenadas?.y || tag.y || 0,
          firstName: tag.nombres || tag.firstName || '',
          lastName: tag.apellidos || tag.lastName || '',
          vinculo: tag.vinculo || '',
          yearIngreso: tag.añoIngreso || tag.yearIngreso || ''
        }));

        // Validate that all required fields are present
        const validTags = uploadedTags.filter(tag => 
          tag.firstName && tag.lastName && tag.vinculo && tag.yearIngreso
        );

        if (validTags.length === 0) {
          alert('No se encontraron etiquetas válidas en el archivo');
          return;
        }

        if (validTags.length !== uploadedTags.length) {
          alert(`Se cargaron ${validTags.length} etiquetas válidas de ${uploadedTags.length} total`);
        }

        // Ask user if they want to replace existing tags or add to them
        let finalTags;
        if (tags.length > 0) {
          const replace = confirm(`Ya hay ${tags.length} etiquetas. ¿Desea reemplazarlas con las ${validTags.length} etiquetas del archivo?`);
          if (replace) {
            finalTags = validTags;
            setTags(finalTags);
          } else {
            finalTags = [...tags, ...validTags];
            setTags(finalTags);
          }
        } else {
          finalTags = validTags;
          setTags(finalTags);
        }

        // Save the uploaded tags to server
        await saveTagsToServer(finalTags);
        alert(`Se cargaron ${validTags.length} etiquetas exitosamente`);
        
      } catch (error) {
        alert('Error al leer el archivo JSON. Verifique que el archivo no esté corrupto.');
        console.error('Error parsing JSON:', error);
      }
    };

    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  const handleDragStart = useCallback((e: React.MouseEvent, tagId: string) => {
    // Don't allow dragging in view-only mode or on mobile devices
    if (isViewOnly || isMobile) return;
    
    e.preventDefault();
    setDraggedTag(tagId);
    setIsDragging(true);
    setDragStartPosition({ x: e.clientX, y: e.clientY });
  }, [isViewOnly, isMobile]);

  const handleDragMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !draggedTag) return;
    
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const updatedTags = tags.map(tag => 
      tag.id === draggedTag 
        ? { ...tag, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
        : tag
    );
    setTags(updatedTags);
  }, [isDragging, draggedTag, tags]);

  const handleDragEnd = useCallback(async () => {
    setDraggedTag(null);
    setIsDragging(false);
    // Only set justFinishedDragging if we were actually dragging
    if (draggedTag) {
      setJustFinishedDragging(true);
      setTimeout(() => setJustFinishedDragging(false), 200);
      // Save the updated tags after dragging
      await saveTagsToServer(tags);
    }
  }, [draggedTag, tags, saveTagsToServer]);

  const getStarColor = useCallback((vinculo: string) => {
    switch (vinculo) {
      case 'Docente':
        return 'text-blue-500 fill-blue-500 stroke-black stroke-1';
      case 'Estudiante':
        return 'text-yellow-500 fill-yellow-500 stroke-black stroke-1';
      case 'Egresad@':
        return 'text-red-500 fill-red-500 stroke-black stroke-1';
      case 'Administración':
        return 'text-green-500 fill-green-500 stroke-black stroke-1';
      default:
        return 'text-yellow-400 fill-yellow-400 stroke-black stroke-1';
    }
  }, []);

  const handleModalClose = useCallback(() => {
    setShowModal(false);
    setFirstName('');
    setLastName('');
    setVinculo('');
    setYearIngreso('');
    setEditingTag(null);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setDraggedTag(null);
    setIsDragging(false);
  }, []);

  // Memoize the tags list to prevent unnecessary re-renders
  const memoizedTags = useMemo(() => tags, [tags]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl font-bold text-gray-900">
              Pregrado de Astronomía - UdeA (2025): ¡16 años cumplidos!
            </h1>
          </div>
          {isClient && isMobile && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 font-medium text-center">
                Para etiquetar debes usar un computador de escritorio
              </p>
            </div>
          )}
          <p className="text-lg text-gray-600">
            {isViewOnly 
              ? "Visualiza las personas etiquetadas en la foto del cumpleaños 16 del pregrado de astronomía 2025. Pasa el mouse sobre las estrellas para ver la información de cada persona."
              : "Etiqueta las personas en la foto del cumpleaños 16 del pregrado de astronomía 2025. Haga clic en cualquier parte de la imagen para agregar información de una persona. "
            }
          </p>
          {isSaving && (
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Guardando etiquetas...
            </div>
          )}
        </div>

        <div className="relative max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          <div 
            className={`relative ${isViewOnly || isMobile ? 'cursor-default' : 'cursor-crosshair'}`}
            onClick={handleImageClick}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleMouseLeave}
            style={{ minHeight: '400px' }}
          >
            <Image
              src="/pregrado-astronomia-2025.jpg"
              alt="Pregrado Astronomía 2025 - Click to tag people"
              width={1920}
              height={1080}
              className="w-full h-auto"
              priority
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            />
            
            {/* Render star markers - Hidden on mobile devices */}
            {isClient && !isMobile && memoizedTags.map((tag) => (
              <div
                key={tag.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                style={{
                  left: `${tag.x}%`,
                  top: `${tag.y}%`,
                }}
              >
                {/* Star marker */}
                        <div className="relative">
                          <Sun 
                            size={12} 
                            className={`${getStarColor(tag.vinculo)} drop-shadow-lg ${isViewOnly || isMobile ? 'cursor-default' : 'cursor-move'} hover:scale-110 transition-transform ${
                              draggedTag === tag.id ? 'scale-125 shadow-xl' : ''
                            }`}
                            onMouseDown={(e) => handleDragStart(e, tag.id)}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              if (isAdmin && !isMobile) {
                                removeTag(tag.id);
                              }
                            }}
                          />
                  
                  {/* Tooltip with name and vínculo */}
                  <div className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 transition-opacity duration-200 pointer-events-none ${
                    !isDragging && !justFinishedDragging ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
                  }`}>
                    <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap relative">
                      <div className="flex items-center gap-2">
                        <User size={14} />
                        <span>{tag.firstName} {tag.lastName}</span>
                      </div>
                      <div className="text-xs text-gray-300 mt-1">
                        {tag.vinculo}
                      </div>
                      {/* Arrow pointing up */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal for adding tags */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
              <h2 className="text-xl font-semibold mb-4">
                {editingTag ? 'Editar Persona' : 'Agregar Persona'}
              </h2>
              <form onSubmit={editingTag ? handleEditSubmit : handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombres
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ingrese los nombres"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ingrese los apellidos"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="vinculo" className="block text-sm font-medium text-gray-700 mb-2">
                    Vínculo
                  </label>
                  <select
                    id="vinculo"
                    value={vinculo}
                    onChange={(e) => setVinculo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="Docente">Docente</option>
                    <option value="Estudiante">Estudiante</option>
                    <option value="Egresad@">Egresad@</option>
                    <option value="Administración">Administración</option>
                  </select>
                </div>
                        <div className="mb-6">
                          <label htmlFor="yearIngreso" className="block text-sm font-medium text-gray-700 mb-2">
                            Año de ingreso al pregrado (opcional)
                          </label>
                          <input
                            type="number"
                            id="yearIngreso"
                            value={yearIngreso}
                            onChange={(e) => setYearIngreso(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: 2020"
                            min="1900"
                            max="2030"
                          />
                        </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 ${
                      isSubmitting 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {editingTag ? 'Actualizando...' : 'Agregando...'}
                      </>
                    ) : (
                      editingTag ? 'Actualizar Persona' : 'Agregar Persona'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleModalClose}
                    disabled={isSubmitting}
                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                      isSubmitting 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

                {/* Tags summary - Hidden in view-only mode */}
                {!isViewOnly && tags.length > 0 && (
                  <div className="mt-8 max-w-6xl mx-auto">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                      Personas Etiquetadas ({tags.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {memoizedTags
                        .slice()
                        .sort((a, b) => {
                          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
                          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
                          return nameA.localeCompare(nameB);
                        })
                        .map((tag) => (
                <div key={tag.id} className="bg-white p-4 rounded-lg shadow border">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={20} className="text-blue-600" />
                    <span className="font-medium">{tag.firstName} {tag.lastName}</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Vínculo:</span> 
                      <Sun size={16} className={getStarColor(tag.vinculo)} />
                      <span>{tag.vinculo}</span>
                    </div>
                    <div><span className="font-medium">Año de ingreso:</span> {tag.yearIngreso}</div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => startEditing(tag)}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Editar
                    </button>
                    {isAdmin && (
                      <>
                        <span className="text-gray-400">|</span>
                        <button
                          onClick={() => removeTag(tag.id)}
                          className="text-red-600 hover:text-red-800 underline"
                        >
                          Borrar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Download and Upload Buttons - Only visible in admin mode */}
        {isAdmin && (
          <div className="mt-8 text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {/* Download Button */}
              {tags.length > 0 && (
                <button
                  onClick={downloadTags}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Grabar etiquetas
                </button>
              )}
              
              {/* Upload Button */}
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="upload-tags"
                />
                <label
                  htmlFor="upload-tags"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-colors duration-200 flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Subir etiquetas
                </label>
              </div>
            </div>
            
            <div className="mt-3 text-xs text-gray-500 space-y-1">
              {tags.length > 0 && (
                <p>Descarga un archivo JSON con toda la información de las personas etiquetadas</p>
              )}
              <p>Sube un archivo JSON con etiquetas para cargar personas previamente guardadas</p>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            <i>Desarrollado por Jorge I. Zuluaga (Astronomía, UdeA) con la asistencia de Cursor (2025) v0.3.0</i>
            {isViewOnly && (
              <span className="block mt-1 text-xs text-blue-600">
                <Eye className="w-3 h-3 inline mr-1" />
                Modo de solo visualización
              </span>
            )}
          </p>
        </footer>
      </div>
    </div>
  );
}