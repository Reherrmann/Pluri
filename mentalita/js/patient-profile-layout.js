// Mentalita — layout desktop da ficha do paciente.
// Mantém todos os dados visíveis e organiza os cartões em duas colunas.
(function () {
  function info(label, value, full) {
    return typeof infoItem === 'function'
      ? infoItem(label, value, !!full)
      : `<div class="patient-info-item${full ? ' full-width' : ''}"><span class="patient-info-label">${patientEscape(label)}</span><span class="patient-info-value">${patientEscape(value || '—')}</span></div>`;
  }

  window.renderDadosPessoais = function (p) {
    const insurance = p.hasInsurance === 'Sim';
    return `<div class="patient-section patient-data-desktop-layout">
      <h2>Dados pessoais</h2>
      <div class="patient-data-card-grid">
        <div class="patient-info-card patient-data-card">
          <h3>Identificação</h3>
          <div class="patient-info-grid">
            ${info('ID', p._row)}
            ${info('Data de cadastro', p.created)}
            ${info('Nome completo', p.name, true)}
            ${info('Data de nascimento', p.birthDate)}
            ${info('Idade', p.age)}
            ${info('Sexo', p.gender)}
            ${info('Estado civil', p.maritalStatus)}
            ${info('CPF', p.cpf)}
            ${info('RG', p.rg)}
            ${info('Profissão', p.profession)}
          </div>
        </div>

        <div class="patient-info-card patient-data-card">
          <h3>Contato</h3>
          <div class="patient-info-grid">
            ${info('E-mail', p.email)}
            ${info('Telefone', p.phone)}
            ${info('Celular', p.mobile)}
            ${info('Enviar lembretes', p.sendReminders || 'Não')}
          </div>
        </div>

        <div class="patient-info-card patient-data-card">
          <h3>Endereço</h3>
          <div class="patient-info-grid">
            ${info('CEP', p.zipCode)}
            ${info('Endereço', [p.address, p.number].filter(Boolean).join(', '), true)}
            ${info('Complemento', p.complement)}
            ${info('Bairro', p.neighborhood)}
            ${info('Cidade', p.city)}
            ${info('Estado', p.state)}
          </div>
        </div>

        <div class="patient-info-card patient-data-card">
          <h3>Família</h3>
          <div class="patient-info-grid">
            ${info('Nome da mãe', p.motherName)}
            ${info('Nome do pai', p.fatherName)}
            ${info('Contato familiar', p.familyContactName)}
            ${info('Grau de parentesco', p.familyContactRelationship)}
            ${info('Telefone familiar', p.familyContactPhone)}
          </div>
        </div>

        <div class="patient-info-card patient-data-card patient-data-card-insurance">
          <h3>Convênio</h3>
          <div class="patient-info-grid">
            ${info('Possui convênio', p.hasInsurance || 'Não')}
            ${info('Convênio', insurance ? p.insuranceName : '')}
            ${info('Plano', insurance ? p.insurancePlan : '')}
            ${info('Carteirinha', insurance ? p.insuranceCard : '')}
            ${info('Validade', insurance ? p.insuranceExpiration : '')}
          </div>
        </div>

        <div class="patient-info-card patient-data-card patient-data-card-notes">
          <h3>Observações</h3>
          <p class="patient-tab-note">${patientEscape(p.notes || 'Nenhuma observação cadastrada.')}</p>
        </div>
      </div>
    </div>`;
  };
})();
