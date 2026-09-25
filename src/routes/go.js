const express = require('express');

const router = express.Router();

const targets = {
  github: {
    env: 'GITHUB_PROFILE_URL'
  },

  linkedin: {
    env: 'LINKEDIN_PROFILE_URL'
  },

  atlantida360: {
    env: 'GITHUB_ATLANTIDA360_URL'
  },

  orderManagement: {
    env: 'GITHUB_ORDER_MANAGEMENT_URL'
  }
};

router.get('/:profile', (request, response) => {
  try {
    const { profile } = request.params;

    const config = targets[profile];

    if (!config) {
      return response.status(404).json({
        ok: false,
        message: 'Perfil no disponible.'
      });
    }

    const profileUrl = process.env[config.env];

    if (!profileUrl) {
      return response.status(404).json({
        ok: false,
        message: 'Perfil no disponible.'
      });
    }

    let url;

    try {
      url = new URL(profileUrl);
    } catch {
      return response.status(500).json({
        ok: false,
        message: 'Configuración inválida.'
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
  } catch (error) {
    console.error(
      '[GO_REDIRECT_ERROR]',
      error
    );

    return response.status(500).json({
      ok: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;