// PLURI OS — Convênio na ficha do paciente
// Abre a mesma ficha de edição usada por "Editar dados" e posiciona
// o formulário na seção Convênio.

(function installConvenioPatientButton() {
    function install() {
        if (typeof window.openPatientForm !== 'function') {
            setTimeout(install, 100);
            return;
        }

        if (window.__pluriConvenioPatientButtonInstalled) return;
        window.__pluriConvenioPatientButtonInstalled = true;

        window.openPatientConvenioForm = function (row) {
            const patients = window.state?.patients || [];
            const patient = patients.find(p => Number(p._row) === Number(row));

            if (!patient) {
                console.error('PLURI OS: paciente não encontrado para editar convênio.', row);
                return;
            }

            // Reutiliza exatamente o mesmo fluxo de "Editar dados".
            window.openPatientForm(patient);

            // Aguarda o slide-panel terminar de renderizar e abre a seção Convênio.
            setTimeout(() => {
                const details = document.querySelector('#slidePanel #insurance-fields')?.closest('.form-section');
                if (details) details.scrollIntoView({ behavior: 'smooth', block: 'start' });

                const checkbox = document.querySelector('#slidePanel [name="hasInsurance"]');
                if (checkbox && !checkbox.checked) {
                    checkbox.checked = true;
                    if (typeof window.toggleInsuranceFields === 'function') {
                        window.toggleInsuranceFields(true);
                    }
                }
            }, 120);
        };

        if (typeof window.renderPatientSectionContent === 'function') {
            const originalRender = window.renderPatientSectionContent;
            if (!window.__pluriConvenioPatientSectionWrapped) {
                window.__pluriConvenioPatientSectionWrapped = true;
                window.renderPatientSectionContent = async function (section) {
                    if (section === 'convenios' && window.state?.selectedPatient) {
                        const p = window.state.selectedPatient;
                        return `
                            <div class="patient-section">
                                <h2>Convênios</h2>
                                <div class="patient-empty-state">
                                    <h3>Convênio do paciente</h3>
                                    <p>Gerencie o convênio, plano, carteirinha e validade deste paciente.</p>
                                    <button class="btn btn-outline" type="button" onclick="openPatientConvenioForm(${Number(p._row)})">
                                        Adicionar convênio
                                    </button>
                                </div>
                            </div>
                        `;
                    }

                    return originalRender.apply(this, arguments);
                };
            }
        }
    }

    install();
})();
