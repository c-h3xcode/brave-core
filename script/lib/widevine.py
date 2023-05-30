# Copyright (c) 2023 The Brave Authors. All rights reserved.
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at https://mozilla.org/MPL/2.0/.

from os.path import dirname, realpath, join, exists

import os

from lib.util import execute

SIGNATURE_GENERATOR_PY = \
    realpath(join(dirname(dirname(dirname(dirname(__file__)))), 'third_party',
             'widevine', 'scripts', 'signature_generator_python3.py'))
MACHOLIB_DIR = \
    realpath(join(dirname(dirname(dirname(__file__))), 'third_party',
             'macholib'))

SIGN_WIDEVINE_CERT = os.getenv('SIGN_WIDEVINE_CERT')
SIGN_WIDEVINE_KEY = os.getenv('SIGN_WIDEVINE_KEY')
SIGN_WIDEVINE_PASSPHRASE = os.getenv('SIGN_WIDEVINE_PASSPHRASE')


def can_generate_sig_file():
    return exists(SIGNATURE_GENERATOR_PY) and SIGN_WIDEVINE_CERT and \
           SIGN_WIDEVINE_KEY and SIGN_WIDEVINE_PASSPHRASE


def generate_sig_file(input_file, output_file, flags):
    env = dict(os.environ)
    env['PYTHONPATH'] = MACHOLIB_DIR
    execute(
        [
            # Use vpython3 because the script needs the `cryptography` library:
            'vpython3',
            SIGNATURE_GENERATOR_PY,
            '--input_file',
            input_file,
            '--output_file',
            output_file,
            '--flags',
            flags,
            '--certificate',
            SIGN_WIDEVINE_CERT,
            '--private_key',
            SIGN_WIDEVINE_KEY,
            '--private_key_passphrase',
            SIGN_WIDEVINE_PASSPHRASE
        ],
        env
    )
    assert exists(output_file)
