'use client';

import { useState, useEffect } from 'react';
import { IDocument } from '@/types';
import { FileText, Download, Eye, Calendar, FolderOpen, Search } from 'lucide-react';

export default function ApplicantDocumentsPage() {
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api/documents/admission');
        if (!response.ok) {
          throw new Error('Ошибка при загрузке документов');
        }
        const data = await response.json();
        setDocuments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // Filter documents based on search term
  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get file icon based on URL
  const getFileIcon = (fileUrl: string) => {
    const extension = fileUrl.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📽️';
      default:
        return '📄';
    }
  };

  // Get file type label
  const getFileType = (fileUrl: string) => {
    const extension = fileUrl.split('.').pop()?.toLowerCase();
    return extension?.toUpperCase() || 'FILE';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="text-red-600 font-medium">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Документы для поступления</h1>
        <p className="text-slate-600 text-lg">
          Все необходимые документы и формы для абитуриентов НАТК
        </p>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 rounded-xl p-3">
            <FolderOpen size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{documents.length}</div>
            <div className="text-indigo-100">документов для поступления</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Поиск документов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-slate-500">
            Найдено: {filteredDocuments.length} документов
          </div>
        )}
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-slate-50 rounded-xl p-12 text-center">
          <FileText size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            {searchTerm ? 'Документы не найдены' : 'Документы пока не добавлены'}
          </h3>
          <p className="text-slate-500">
            {searchTerm ? 'Попробуйте изменить поисковый запрос' : 'Следите за обновлениями'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((document) => (
            <div
              key={document.id}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-indigo-300 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                {/* Document Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-2xl">
                      {getFileIcon(document.fileUrl)}
                    </div>
                  </div>

                  {/* Document Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1 truncate">
                      {document.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-medium">
                        {getFileType(document.fileUrl)}
                      </span>
                      {document.category && (
                        <span className="flex items-center gap-1">
                          <FolderOpen size={14} />
                          {document.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <a
                    href={document.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
                  >
                    <Eye size={16} />
                    <span>Просмотр</span>
                  </a>
                  <a
                    href={document.fileUrl}
                    download
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <Download size={16} />
                    <span>Скачать</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Section */}
      <div className="bg-indigo-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-indigo-900 mb-3">Нужна помощь?</h3>
        <div className="space-y-2 text-indigo-700">
          <p>• Если у вас возникли вопросы по документам, свяжитесь с приемной комиссией</p>
          <p>• Убедитесь, что все документы заполнены корректно и подписаны</p>
          <p>• Прикрепляйте сканы или фотографии хорошего качества</p>
        </div>
      </div>
    </div>
  );
}
