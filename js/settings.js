/* Settings page: service management and admin user management. */
(function () {
  'use strict';

  const workspace = window.LaundryWorkspace;
  const page = document.getElementById('settingsPage');
  if (!workspace || !page) return;

  const online = window.LaundryBackend;
  const escape = workspace.escape;
  const money = workspace.money;
  const icon = workspace.icon;
  const $ = (id) => document.getElementById(id);

  /* ------------------------------------------------------------------ */
  /* Service data (offline demo fallback or backend)                     */
  /* ------------------------------------------------------------------ */
  const STORAGE_KEY_SERVICES = 'laundry-settings-services-v1';
  const STORAGE_KEY_USERS = 'laundry-settings-users-v1';

  function loadServices() {
    if (online) {
      return online.data.services.map((s) => ({ ...s }));
    }
    // Build from workspace services list
    const ws = workspace.getService;
    const ids = Object.keys(workspace._allServices ? workspace._allServices : {});
    if (ids.length) return ids.map((id) => ({ ...workspace._allServices[id] }));
    // Fallback: read from local storage or seed
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_SERVICES) || 'null');
      if (Array.isArray(saved) && saved.length) return saved;
    } catch (e) { /* ignore */ }
    return [
      { service_id: 1, service_name: 'Wash & Fold', unit_price: 35, pricing_unit: 'per kg', service_status: 'Active', description: null },
      { service_id: 2, service_name: 'Dry Cleaning', unit_price: 75, pricing_unit: 'per kg', service_status: 'Active', description: null },
      { service_id: 3, service_name: 'Heavy Bedding', unit_price: 150, pricing_unit: 'per load', service_status: 'Active', description: null }
    ];
  }

  function saveServicesLocal(services) {
    try { localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(services)); return true; }
    catch (e) { return false; }
  }

  function loadUsers() {
    if (online && online.data.users) {
      return online.data.users.map((u) => ({ ...u }));
    }
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || 'null');
      if (Array.isArray(saved) && saved.length) return saved;
    } catch (e) { /* ignore */ }
    return [
      { user_id: 101, first_name: 'Juan', last_name: 'Cruz', username: 'admin', role: 'Admin', account_status: 'Active' }
    ];
  }

  function saveUsersLocal(users) {
    try { localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users)); return true; }
    catch (e) { return false; }
  }

  let services = loadServices();
  let users = loadUsers();

  /* ------------------------------------------------------------------ */
  /* Render services table                                              */
  /* ------------------------------------------------------------------ */
  function renderServices() {
    services = loadServices();
    const rows = services.map((s) => `
      <tr data-service-id="${s.service_id}">
        <td><strong>${escape(s.service_name)}</strong></td>
        <td class="amount">${escape(money(s.unit_price))}</td>
        <td>${escape(s.pricing_unit)}</td>
        <td><span class="status-badge ${s.service_status === 'Active' ? 'status-paid' : 'status-pending'}">${escape(s.service_status)}</span></td>
        <td class="row-actions">
          <button type="button" class="secondary-button" data-edit-service="${s.service_id}">Edit</button>
          <button type="button" class="text-button ${s.service_status === 'Active' ? 'danger-text' : ''}" data-toggle-service="${s.service_id}">${s.service_status === 'Active' ? 'Deactivate' : 'Activate'}</button>
        </td>
      </tr>
    `).join('');
    $('servicesRows').innerHTML = rows;
    $('servicesEmpty').classList.toggle('hidden', services.length > 0);
  }

  /* ------------------------------------------------------------------ */
  /* Render users table                                                 */
  /* ------------------------------------------------------------------ */
  function renderUsers() {
    users = loadUsers();
    const rows = users.map((u) => `
      <tr data-user-id="${u.user_id}">
        <td><strong>${escape(u.first_name + ' ' + u.last_name)}</strong></td>
        <td>${escape(u.username || '—')}</td>
        <td><span class="status-badge ${u.role === 'Admin' ? 'status-paid' : 'status-progress'}">${escape(u.role)}</span></td>
        <td><span class="status-badge ${u.account_status === 'Active' ? 'status-paid' : 'status-pending'}">${escape(u.account_status)}</span></td>
        <td class="row-actions">
          <button type="button" class="secondary-button" data-edit-user="${u.user_id}">Edit</button>
        </td>
      </tr>
    `).join('');
    $('adminRows').innerHTML = rows;
    $('adminEmpty').classList.toggle('hidden', users.length > 0);
  }

  /* ------------------------------------------------------------------ */
  /* Service dialog                                                     */
  /* ------------------------------------------------------------------ */
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay hidden" id="serviceOverlay">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="serviceFormTitle">
        <header class="modal-header">
          <div><span class="eyebrow">SERVICE</span><h2 id="serviceFormTitle">Add service</h2></div>
          <button type="button" class="icon-button" data-close-service aria-label="Close service editor">${icon('x')}</button>
        </header>
        <form id="serviceForm" novalidate>
          <div class="form-grid">
            <label class="form-field full-width"><span>Service name <span class="required-mark">*</span></span><input id="serviceName" required maxlength="50" placeholder="e.g. Wash & Fold"></label>
            <label class="form-field"><span>Unit price (₱) <span class="required-mark">*</span></span><input id="servicePrice" type="number" min="0.01" max="99999999.99" step="0.01" required placeholder="e.g. 35"></label>
            <label class="form-field"><span>Pricing unit <span class="required-mark">*</span></span>
              <select id="servicePricingUnit">
                <option value="per kg">per kg</option>
                <option value="per load">per load</option>
              </select>
            </label>
            <label class="form-field"><span>Status</span>
              <select id="serviceStatus">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
            <label class="form-field full-width"><span>Description (optional)</span><input id="serviceDescription" maxlength="100" placeholder="e.g. Standard wash and fold service"></label>
          </div>
          <p class="form-error hidden" id="serviceError" role="alert"></p>
          <div class="modal-actions">
            <button class="secondary-button" type="button" data-close-service>Cancel</button>
            <button class="primary-button" type="submit" id="saveServiceButton">Save service</button>
          </div>
        </form>
      </section>
    </div>
  `);

  let editingServiceId = null;

  function openServiceForm(serviceId) {
    const service = serviceId ? services.find((s) => s.service_id === Number(serviceId)) : null;
    editingServiceId = service ? service.service_id : null;
    $('serviceForm').reset();
    $('serviceError').classList.add('hidden');
    $('serviceFormTitle').textContent = service ? 'Edit service' : 'Add service';
    $('saveServiceButton').textContent = service ? 'Save changes' : 'Add service';
    $('serviceName').value = service?.service_name || '';
    $('servicePrice').value = service?.unit_price ?? '';
    $('servicePricingUnit').value = service?.pricing_unit || 'per kg';
    $('serviceStatus').value = service?.service_status || 'Active';
    $('serviceDescription').value = service?.description || '';
    workspace.openDialog('serviceOverlay');
  }

  $('addServiceButton').addEventListener('click', () => openServiceForm());

  $('serviceForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = $('serviceName').value.trim();
    const price = Number($('servicePrice').value);
    const unit = $('servicePricingUnit').value;
    const status = $('serviceStatus').value;
    const description = $('serviceDescription').value.trim() || null;

    if (!name || name.length > 50) {
      $('serviceError').textContent = 'Enter a service name (1–50 characters).';
      $('serviceError').classList.remove('hidden');
      $('serviceName').focus();
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      $('serviceError').textContent = 'Enter a valid unit price greater than zero.';
      $('serviceError').classList.remove('hidden');
      $('servicePrice').focus();
      return;
    }

    if (online) {
      try {
        const body = { service_name: name, unit_price: price, pricing_unit: unit, service_status: status, description };
        if (editingServiceId) body.service_id = editingServiceId;
        const result = await online.request(editingServiceId ? `/api/services/${editingServiceId}` : '/api/services', {
          method: editingServiceId ? 'PATCH' : 'POST',
          body
        });
        // Refresh bootstrap data
        const data = await online.request('/api/bootstrap');
        online.data = data;
      } catch (err) {
        $('serviceError').textContent = err.message;
        $('serviceError').classList.remove('hidden');
        return;
      }
    } else {
      if (editingServiceId) {
        const idx = services.findIndex((s) => s.service_id === editingServiceId);
        if (idx !== -1) {
          services[idx] = { ...services[idx], service_name: name, unit_price: price, pricing_unit: unit, service_status: status, description };
          workspace.updateService?.(services[idx]);
        }
      } else {
        const newId = Math.max(0, ...services.map((s) => s.service_id)) + 1;
        const newSvc = { service_id: newId, service_name: name, unit_price: price, pricing_unit: unit, service_status: status, description };
        services.push(newSvc);
        workspace.updateService?.(newSvc);
      }
      saveServicesLocal(services);
    }
    workspace.closeDialog('serviceOverlay');
    workspace.showToast(editingServiceId ? 'Service updated.' : 'Service added.');
    renderServices();
  });

  document.querySelectorAll('[data-close-service]').forEach((btn) =>
    btn.addEventListener('click', () => workspace.closeDialog('serviceOverlay'))
  );
  $('serviceOverlay').addEventListener('click', (e) => {
    if (e.target === $('serviceOverlay')) workspace.closeDialog('serviceOverlay');
  });

  page.addEventListener('click', (event) => {
    const editBtn = event.target.closest('[data-edit-service]');
    if (editBtn) { openServiceForm(editBtn.dataset.editService); return; }

    const toggleBtn = event.target.closest('[data-toggle-service]');
    if (toggleBtn) {
      const sid = Number(toggleBtn.dataset.toggleService);
      const service = services.find((s) => s.service_id === sid);
      if (service) {
        service.service_status = service.service_status === 'Active' ? 'Inactive' : 'Active';
        if (online) {
          online.request(`/api/services/${sid}`, {
            method: 'PATCH',
            body: { service_name: service.service_name, unit_price: service.unit_price, pricing_unit: service.pricing_unit, service_status: service.service_status, description: service.description }
          }).then(() => online.request('/api/bootstrap').then((data) => { online.data = data; renderServices(); }))
            .catch((err) => { workspace.showToast(err.message); renderServices(); });
        } else {
          saveServicesLocal(services);
          workspace.updateService?.(service);
        }
        renderServices();
        workspace.showToast(`Service ${service.service_status === 'Active' ? 'activated' : 'deactivated'}.`);
      }
      return;
    }

    const editUser = event.target.closest('[data-edit-user]');
    if (editUser) { openUserForm(editUser.dataset.editUser); return; }
  });

  /* ------------------------------------------------------------------ */
  /* Admin user dialog                                                  */
  /* ------------------------------------------------------------------ */
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay hidden" id="adminOverlay">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="adminFormTitle">
        <header class="modal-header">
          <div><span class="eyebrow">USER ACCOUNT</span><h2 id="adminFormTitle">Add user</h2></div>
          <button type="button" class="icon-button" data-close-admin aria-label="Close user editor">${icon('x')}</button>
        </header>
        <form id="adminForm" novalidate>
          <div class="form-grid">
            <label class="form-field"><span>First name <span class="required-mark">*</span></span><input id="adminFirstName" required maxlength="30" placeholder="e.g. Maria"></label>
            <label class="form-field"><span>Last name <span class="required-mark">*</span></span><input id="adminLastName" required maxlength="30" placeholder="e.g. Santos"></label>
            <label class="form-field"><span>Username <span class="required-mark">*</span></span><input id="adminUsername" required maxlength="30" placeholder="e.g. maria.santos" autocomplete="off"></label>
            <label class="form-field"><span>Password <span id="adminPasswordLabel">*</span></span><input id="adminPassword" type="password" maxlength="128" placeholder="Min 12 characters" autocomplete="new-password"></label>
            <label class="form-field"><span>Role</span>
              <select id="adminRole">
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
              </select>
            </label>
            <label class="form-field"><span>Status</span>
              <select id="adminStatus">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
          </div>
          <p class="form-error hidden" id="adminError" role="alert"></p>
          <div class="modal-actions">
            <button class="secondary-button" type="button" data-close-admin>Cancel</button>
            <button class="primary-button" type="submit" id="saveAdminButton">Save user</button>
          </div>
        </form>
      </section>
    </div>
  `);

  let editingUserId = null;

  function openUserForm(userId) {
    const user = userId ? users.find((u) => u.user_id === Number(userId)) : null;
    editingUserId = user ? user.user_id : null;
    $('adminForm').reset();
    $('adminError').classList.add('hidden');
    $('adminFormTitle').textContent = user ? 'Edit user' : 'Add user';
    $('saveAdminButton').textContent = user ? 'Save changes' : 'Add user';
    $('adminFirstName').value = user?.first_name || '';
    $('adminLastName').value = user?.last_name || '';
    $('adminUsername').value = user?.username || '';
    $('adminPassword').value = '';
    $('adminPasswordLabel').textContent = user ? '(leave blank to keep)' : '*';
    $('adminPassword').required = !user;
    $('adminRole').value = user?.role || 'Staff';
    $('adminStatus').value = user?.account_status || 'Active';
    workspace.openDialog('adminOverlay');
  }

  $('addAdminButton').addEventListener('click', () => openUserForm());

  $('adminForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const firstName = $('adminFirstName').value.trim();
    const lastName = $('adminLastName').value.trim();
    const username = $('adminUsername').value.trim();
    const password = $('adminPassword').value;
    const role = $('adminRole').value;
    const accountStatus = $('adminStatus').value;

    if (!firstName || !lastName) {
      $('adminError').textContent = 'Enter first and last names.';
      $('adminError').classList.remove('hidden');
      $('adminFirstName').focus();
      return;
    }
    if (!username || username.length > 30) {
      $('adminError').textContent = 'Enter a username (1–30 characters).';
      $('adminError').classList.remove('hidden');
      $('adminUsername').focus();
      return;
    }
    if (!editingUserId && (!password || password.length < 12)) {
      $('adminError').textContent = 'Password must be at least 12 characters.';
      $('adminError').classList.remove('hidden');
      $('adminPassword').focus();
      return;
    }
    if (password && password.length < 12) {
      $('adminError').textContent = 'Password must be at least 12 characters.';
      $('adminError').classList.remove('hidden');
      $('adminPassword').focus();
      return;
    }

    if (online) {
      try {
        const body = { first_name: firstName, last_name: lastName, username, role, account_status: accountStatus };
        if (password) body.password = password;
        if (editingUserId) body.user_id = editingUserId;
        await online.request(editingUserId ? `/api/users/${editingUserId}` : '/api/users', {
          method: editingUserId ? 'PATCH' : 'POST',
          body
        });
        const data = await online.request('/api/bootstrap');
        online.data = data;
      } catch (err) {
        $('adminError').textContent = err.message;
        $('adminError').classList.remove('hidden');
        return;
      }
    } else {
      if (editingUserId) {
        const idx = users.findIndex((u) => u.user_id === editingUserId);
        if (idx !== -1) {
          users[idx] = { ...users[idx], first_name: firstName, last_name: lastName, username, role, account_status: accountStatus };
        }
      } else {
        // Check for duplicate username
        if (users.some((u) => u.username === username)) {
          $('adminError').textContent = 'A user with this username already exists.';
          $('adminError').classList.remove('hidden');
          $('adminUsername').focus();
          return;
        }
        const newId = Math.max(0, ...users.map((u) => u.user_id)) + 1;
        users.push({ user_id: newId, first_name: firstName, last_name: lastName, username, role, account_status: accountStatus });
      }
      saveUsersLocal(users);
    }
    workspace.closeDialog('adminOverlay');
    workspace.showToast(editingUserId ? 'User updated.' : 'User added.');
    renderUsers();
  });

  document.querySelectorAll('[data-close-admin]').forEach((btn) =>
    btn.addEventListener('click', () => workspace.closeDialog('adminOverlay'))
  );
  $('adminOverlay').addEventListener('click', (e) => {
    if (e.target === $('adminOverlay')) workspace.closeDialog('adminOverlay');
  });

  /* ------------------------------------------------------------------ */
  /* Init                                                               */
  /* ------------------------------------------------------------------ */
  function render() {
    renderServices();
    renderUsers();
  }

  // Install icons in the settings page
  page.querySelectorAll('[data-icon]').forEach((el) => {
    el.innerHTML = icon(el.dataset.icon);
  });

  workspace.subscribe(render);
  render();
})();
