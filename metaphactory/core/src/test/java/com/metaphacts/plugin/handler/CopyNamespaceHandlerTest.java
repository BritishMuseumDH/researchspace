/*
 * Copyright (C) 2015-2017, metaphacts GmbH
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, you can receive a copy
 * of the GNU Lesser General Public License from http://www.gnu.org/
 */

package com.metaphacts.plugin.handler;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.hasItems;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.io.IOException;
import java.util.List;

import org.apache.commons.io.FileUtils;
import org.eclipse.rdf4j.model.vocabulary.FOAF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.SP;
import org.eclipse.rdf4j.model.vocabulary.SPIN;
import org.junit.Test;

import com.google.common.collect.Lists;

/**
 * @author Johannes Trame <jt@metaphacts.com>
 *
 */
public class CopyNamespaceHandlerTest extends InstallationHandlerTest {

    
    @Test
    public void testCopyNoneExistingNamespaces() throws IOException{
        assertFalse(ns.get().getNamespace("rdfs").isPresent());
        ns.get().addProperty("rdfs", RDFS.NAMESPACE);
        assertEquals(ns.get().getNamespace("rdfs").get(), RDFS.NAMESPACE);
        
        assertFalse(ns.get().getNamespace("foaf").isPresent());
        
        final File appDir = createTestAppDir();
        final File pluginNamespaceProp = new File(appDir, "/config/namespaces.prop");
        assertTrue(pluginNamespaceProp.createNewFile());
        
        FileUtils.writeLines(pluginNamespaceProp, Lists.newArrayList(
                "Admin = "+ SPIN.NAMESPACE,
                "rdfs = "+ SP.NAMESPACE,
                "foaf = "+ FOAF.NAMESPACE
                ));
        
        CopyNamespaceHandler handler = new CopyNamespaceHandler(config, ns.get(), appDir.toPath());
        handler.install();
        
        assertEquals(ns.get().getNamespace("rdfs").get(), RDFS.NAMESPACE);
        assertEquals(ns.get().getNamespace("foaf").get(), FOAF.NAMESPACE);
        
        assertThat(appender.getLogMessages(), hasItems(
                "Plugin namespace Admin already exists in platform namespaces. Skipping.",
                "Plugin namespace rdfs already exists in platform namespaces. Skipping.",
                "Added new namespace foaf:<http://xmlns.com/foaf/0.1/> to platform namespaces."
                ));
    }
    
    @SuppressWarnings("unchecked")
    @Override
    protected List<Class<? extends PluginBaseInstallationHandler>> getClassesToLog() {
        return Lists.newArrayList(CopyNamespaceHandler.class);
    }

}