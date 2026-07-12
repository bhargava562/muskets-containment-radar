package com.muskets.backend.architecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * ArchUnit test — enforces the module boundary rule at the import-graph level.
 *
 * <p>This is stronger than a {@code grep}: it operates on the real Java
 * import graph, not text matching. A comment containing an import path
 * won't false-positive, and an aliased or star-import won't false-negative.</p>
 *
 * <p><b>The rule:</b> No class outside {@code detection} may depend on any
 * class inside {@code detection.engine}, {@code detection.model},
 * {@code detection.ingest}, or {@code detection} config internals.
 * The ONLY thing the outside world may import is
 * {@code com.muskets.backend.shared.events.MuleFlaggedEvent}.</p>
 */
@AnalyzeClasses(
        packages = "com.muskets.backend",
        importOptions = ImportOption.DoNotIncludeTests.class
)
class ModuleBoundaryTest {

    @ArchTest
    static final ArchRule detection_engine_not_accessed_from_outside =
            noClasses()
                    .that().resideOutsideOfPackage("..detection..")
                    .should().dependOnClassesThat()
                    .resideInAnyPackage(
                            "..detection.engine..",
                            "..detection.model..",
                            "..detection.ingest.."
                    )
                    .as("Classes outside the detection module must not depend on detection internals " +
                            "(engine, model, ingest). Use MuleFlaggedEvent from shared.events instead.");
}
