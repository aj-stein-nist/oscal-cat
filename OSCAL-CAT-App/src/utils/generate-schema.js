const {
    quicktype,
    InputData,
    JSONSchemaInput,
    FetchingJSONSchemaStore,
} = require('quicktype-core');

const fs = require('fs');

async function generateInterfaces(rendererLanguage, rendererOptions, typeName, schema) {
    const schemaInput = new JSONSchemaInput(new FetchingJSONSchemaStore());
    await schemaInput.addSource({ name: typeName, schema });
    const inputData = new InputData();
    inputData.addInput(schemaInput);
    return await quicktype({
        inputData,
        targetLanguage: rendererLanguage,
        rendererOptions
    });
}

async function main() {
    inputData = fs.readFileSync('../OSCAL/json/schema/oscal_complete_schema.json').toString('utf-8');
    const { lines: interfaces } = await generateInterfaces(
        'typescript',
        {
            "nice-property-names": true
        },
        'Result',
        inputData
    );
    console.log(interfaces.join('\n'));
}

main();