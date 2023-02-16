/* Copyright (c) 2023 The Brave Authors. All rights reserved.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/. */

package org.brave.bytecode;

import org.objectweb.asm.ClassVisitor;

public class BraveBookmarkActionBarClassAdapter extends BraveClassVisitor {
    static String sBookmarkActionBarClassName =
            "org/chromium/chrome/browser/bookmarks/BookmarkActionBar";
    static String sBraveBookmarkActionBarClassName =
            "org/chromium/chrome/browser/bookmarks/BraveBookmarkActionBar";

    public BraveBookmarkActionBarClassAdapter(ClassVisitor visitor) {
        super(visitor);

        redirectConstructor(sBookmarkActionBarClassName, sBraveBookmarkActionBarClassName);

        deleteField(sBraveBookmarkActionBarClassName, "mDelegate");
        makeProtectedField(sBookmarkActionBarClassName, "mDelegate");
    }
}
