const targets = {
  github: {
    env: 'GITHUB_PROFILE_URL',
    hosts: ['github.com']
  },

  linkedin: {
    env: 'LINKEDIN_PROFILE_URL',
    hosts: [
      'linkedin.com',
      'www.linkedin.com'
    ]
  },

  atlantida360: {
    env: 'GITHUB_ATLANTIDA360_URL',
    hosts: ['github.com']
  },

  orderManagement: {
    env: 'GITHUB_ORDER_MANAGEMENT_URL',
    hosts: ['github.com']
  }
};

module.exports = function handler(
  request,
  response
) {
  const {
    profile
  } = request.query;

  const config =
    targets[profile];

  if (!config) {
    return response
      .status(404)
      .json({
        ok: false,
        message:
          'Perfil no disponible.'
      });
  }

  const profileUrl =
    process.env[config.env];

  if (!profileUrl) {
    return response
      .status(404)
      .json({
        ok: false,
        message:
          'Perfil no disponible.'
      });
  }

  let url;

  try {
    url = new URL(profileUrl);
  } catch {
    return response
      .status(500)
      .json({
        ok: false,
        message:
          'Configuración inválida.'
      });
  }

  if (
    url.protocol !== 'https:' ||
    !config.hosts.includes(
      url.hostname
    )
  ) {
    return response
      .status(500)
      .json({
        ok: false,
        message:
          'Configuración inválida.'
      });
  }

  response.setHeader(
    'Cache-Control',
    'no-store'
  );

  return response.redirect(
    302,
    url.toString()
  );
};