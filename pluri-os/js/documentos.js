// js/documentos.js
// Documentos dos pacientes — Google Drive da clínica

(function () {
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    function formatFileSize(bytes) {
        const size = Number(bytes) || 0;
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    function fileIcon(mimeType, name) {
        const type = String(mimeType || '').toLowerCase();
        const ext = String(name || '').split('.').pop().toLowerCase();
        if (type.includes('pdf') || ext === 'pdf') return 'file-text';
        if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
        if (type.includes('word') || ['doc', 'docx'].includes(ext)) return 'file-text';
        if (type.includes('sheet') || ['xls', 'xlsx', 'csv'].includes(ext)) return 'table';
        return 'file';
    }

    function renderDocumentos(patient) {
        if (!patient) return '';

        return `
            <div class="patient-section">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:18px;">
                    <div>
                        <h2 style="margin-bottom:4px;">Documentos</h2>
                        <p style="margin:0;color:var(--text-secondary);font-size:13px;">Arquivos armazenados no Google Drive da clínica.</p>
                    </div>
                    <button class="btn btn-primary" type="button" id="patientAddDocumentBtn">
                        <i data-lucide="upload" style="width:16px;height:16px;"></i>
                        Adicionar documento
                    </button>
                    <input type="file" id="patientDocumentInput" hidden>
                </div>
                <div id="patientDocumentsList" class="patient-info-card">
                    <div style="padding:28px;text-align:center;color:var(--text-secondary);">Carregando documentos...</div>
                </div>
            </div>
        `;
    }

    function bindUpload(patient) {
        const button = document.getElementById('patientAddDocumentBtn');
        const input = document.getElementById('patientDocumentInput');
        if (!button || !input || !patient) return;
        if (button.dataset.documentsBound === 'true') return;

        button.dataset.documentsBound = 'true';

        button.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            input.click();
        });

        input.addEventListener('change', async function () {
            const file = input.files && input.files[0];
            input.value = '';
            if (!file) return;
            await uploadFile(patient, file, button);
        });
    }

    async function uploadFile(patient, file, button) {
        if (file.size > MAX_FILE_SIZE) {
            showToast('O arquivo deve ter no máximo 10 MB.');
            return;
        }

        if (!window.pluriAPI) {
            showToast('API da plataforma não está disponível.');
            return;
        }

        button.disabled = true;
        button.innerHTML = '<i data-lucide="loader-2" style="width:16px;height:16px;"></i> Enviando...';
        if (typeof refreshIcons === 'function') refreshIcons();

        try {
            const result = await window.pluriAPI.uploadPatientDocument(
                patient._row,
                patient.name,
                file
            );

            if (!result || !result.success) {
                throw new Error(result?.error || 'Não foi possível enviar o documento.');
            }

            showToast('Documento enviado com sucesso!');
            await loadPatientDocuments(patient);
        } catch (error) {
            console.error('Erro ao enviar documento:', error);
            showToast(error.message || 'Não foi possível enviar o documento.');
        } finally {
            button.disabled = false;
            button.innerHTML = '<i data-lucide="upload" style="width:16px;height:16px;"></i> Adicionar documento';
            if (typeof refreshIcons === 'function') refreshIcons();
        }
    }

    async function loadPatientDocuments(patient) {
        if (!patient) return;

        bindUpload(patient);

        const container = document.getElementById('patientDocumentsList');
        if (!container) return;

        try {
            const documents = await window.pluriAPI.getPatientDocuments(
                patient._row,
                patient.name
            );

            const files = Array.isArray(documents?.files)
                ? documents.files
                : [];

            if (!files.length) {
                container.innerHTML = `
                    <div style="padding:42px 24px;text-align:center;">
                        <div style="width:48px;height:48px;margin:0 auto 14px;border-radius:12px;background:var(--background-secondary,#f2f4f7);display:flex;align-items:center;justify-content:center;">
                            <i data-lucide="folder-open" style="width:22px;height:22px;color:var(--text-secondary);"></i>
                        </div>
                        <h3 style="margin:0 0 6px;">Nenhum documento</h3>
                        <p style="margin:0;color:var(--text-secondary);font-size:13px;">Adicione exames, documentos e outros arquivos deste paciente.</p>
                    </div>
                `;
                if (typeof refreshIcons === 'function') refreshIcons();
                return;
            }

            container.innerHTML = `
                <div style="display:flex;flex-direction:column;gap:8px;">
                    ${files.map(file => `
                        <div style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--border-color,#e4e7ec);border-radius:10px;">
                            <div style="width:38px;height:38px;border-radius:9px;background:var(--background-secondary,#f2f4f7);display:flex;align-items:center;justify-content:center;flex:0 0 auto;">
                                <i data-lucide="${fileIcon(file.mimeType, file.name)}" style="width:18px;height:18px;color:var(--text-secondary);"></i>
                            </div>
                            <div style="min-width:0;flex:1;">
                                <div style="font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(file.name || 'Documento')}</div>
                                <div style="font-size:12px;color:var(--text-secondary);margin-top:3px;">${formatFileSize(file.size)}${file.modifiedTime ? ' · ' + new Date(file.modifiedTime).toLocaleDateString('pt-BR') : ''}</div>
                            </div>
                            <div style="display:flex;align-items:center;gap:4px;flex:0 0 auto;">
                                ${file.webViewLink ? `<a class="btn btn-icon" href="${escapeHtml(file.webViewLink)}" target="_blank" rel="noopener noreferrer" title="Abrir documento"><i data-lucide="external-link" style="width:16px;height:16px;"></i></a>` : ''}
                                <button class="btn btn-icon" type="button" data-delete-patient-document="${escapeHtml(file.id)}" title="Excluir documento"><i data-lucide="trash-2" style="width:16px;height:16px;"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            container.querySelectorAll('[data-delete-patient-document]').forEach(button => {
                button.addEventListener('click', async () => {
                    const fileId = button.dataset.deletePatientDocument;
                    const file = files.find(item => String(item.id) === String(fileId));
                    if (!file || !window.confirm(`Excluir o documento "${file.name}"?`)) return;

                    button.disabled = true;
                    try {
                        const response = await window.pluriAPI.deletePatientDocument(fileId);
                        if (!response || !response.success) {
                            throw new Error(response?.error || 'Não foi possível excluir o documento.');
                        }
                        showToast('Documento excluído.');
                        await loadPatientDocuments(patient);
                    } catch (error) {
                        console.error('Erro ao excluir documento:', error);
                        button.disabled = false;
                        showToast(error.message || 'Não foi possível excluir o documento.');
                    }
                });
            });

            if (typeof refreshIcons === 'function') refreshIcons();
        } catch (error) {
            console.error('Erro ao carregar documentos:', error);
            container.innerHTML = `
                <div style="padding:28px;text-align:center;">
                    <p style="margin:0 0 12px;color:var(--text-secondary);">Não foi possível carregar os documentos.</p>
                    <button class="btn btn-outline" type="button" id="patientDocumentsRetry">Tentar novamente</button>
                </div>
            `;
            document.getElementById('patientDocumentsRetry')?.addEventListener('click', () => loadPatientDocuments(patient));
        }
    }

    // O index.html carrega este módulo uma única vez, depois de pacientes.js.
    // Fazemos uma única substituição do renderer, sem MutationObserver,
    // setInterval, carregamento dinâmico ou reescritas concorrentes.
    const originalRenderPatientSectionContent = window.renderPatientSectionContent;

    if (typeof originalRenderPatientSectionContent === 'function') {
        window.renderPatientSectionContent = function (section) {
            if (section === 'documentos' && window.state?.selectedPatient) {
                const html = renderDocumentos(window.state.selectedPatient);
                setTimeout(() => loadPatientDocuments(window.state.selectedPatient), 0);
                return html;
            }

            return originalRenderPatientSectionContent.apply(this, arguments);
        };
    } else {
        console.error('PLURI OS: renderPatientSectionContent não está disponível.');
    }

    window.renderPatientDocuments = renderDocumentos;
    window.loadPatientDocuments = loadPatientDocuments;
})();
