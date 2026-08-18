// js/convenios-paciente.js
// Integração entre a aba Convênios e a ficha do paciente.

(function initConveniosPacienteIntegration() {
    if (typeof window.openPatientForm !== 'function') {
        setTimeout(initConveniosPacienteIntegration, 100);
        return;
    }

    if (window.__pluriConveniosPacienteInstalled) return;
    window.__pluriConveniosPacienteInstalled = true;

    const originalOpenPatientForm = window.openPatientForm;

    window.openPatientForm = function (patient) {
        originalOpenPatientForm(patient);
        setTimeout(() => loadPatientInsuranceFields(patient || {}), 0);
    };

    async function loadPatientInsuranceFields(patient) {
        const insuranceNameInput = document.querySelector('#insurance-fields [name="insuranceName"]');
        const insurancePlanInput = document.querySelector('#insurance-fields [name="insurancePlan"]');

        if (!insuranceNameInput || !insurancePlanInput) return;

        try {
            const baseUrl = window.pluriAPI?.config?.appsScript?.baseUrl;
            if (!baseUrl) throw new Error('URL da API não configurada.');

            const data = await window.pluriAPI.get(
                baseUrl + '?action=read&sheet=Convenios'
            );

            const convenios = Array.isArray(data)
                ? data.map(mapConvenio).filter(c => c.name)
                : [];

            replaceInsuranceNameField(insuranceNameInput, convenios, patient.insuranceName || '');

            const selected = convenios.find(c => normalize(c.name) === normalize(patient.insuranceName || ''));
            replaceInsurancePlanField(
                insurancePlanInput,
                selected ? selected.plans : [],
                patient.insurancePlan || ''
            );

            const convenioSelect = document.querySelector('#insurance-fields [name="insuranceName"]');
            convenioSelect?.addEventListener('change', function () {
                const convenio = convenios.find(c => normalize(c.name) === normalize(this.value));
                replaceInsurancePlanField(
                    document.querySelector('#insurance-fields [name="insurancePlan"]'),
                    convenio ? convenio.plans : [],
                    ''
                );
            });

        } catch (error) {
            console.error('Erro ao carregar convênios para o paciente:', error);
        }
    }

    function mapConvenio(row) {
        return {
            name: row['Nome'] || row['Convênio'] || '',
            status: row['Status'] || 'Ativo',
            plans: parseJsonArray(row['Planos']).filter(plan => {
                return String(plan?.status || 'Ativo').toLowerCase() !== 'inativo';
            })
        };
    }

    function parseJsonArray(value) {
        if (Array.isArray(value)) return value;
        if (!value) return [];
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            return [];
        }
    }

    function replaceInsuranceNameField(input, convenios, currentValue) {
        const select = document.createElement('select');
        select.name = 'insuranceName';
        select.innerHTML = '<option value="">Selecione o convênio</option>' +
            convenios
                .filter(c => String(c.status).toLowerCase() !== 'inativo')
                .map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`)
                .join('');

        select.value = currentValue || '';
        input.replaceWith(select);
    }

    function replaceInsurancePlanField(input, plans, currentValue) {
        if (!input) return;

        const select = document.createElement('select');
        select.name = 'insurancePlan';

        const options = plans
            .map(plan => ({
                name: plan?.name || plan?.Nome || '',
                status: plan?.status || 'Ativo'
            }))
            .filter(plan => plan.name);

        select.innerHTML = '<option value="">Selecione o plano</option>' +
            options
                .map(plan => `<option value="${escapeHtml(plan.name)}">${escapeHtml(plan.name)}</option>`)
                .join('');

        select.value = currentValue || '';
        input.replaceWith(select);
    }

    function normalize(value) {
        return String(value || '').trim().toLowerCase();
    }
})();
