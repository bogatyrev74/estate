# smply.gd Estate Javascript Library
In this library you will find a collection of scripts, jquery plugins
and components for our estate ecosystem. You may install this package
via `npm install @smply-gd/estate-library --save`.

Add these two lines to your `.npmrc` file:
```
@smply-gd:registry=https://npm.pkg.github.com/smply-gd
//npm.pkg.github.com/:_authToken=GITHUB_TOKEN
```

You can include the files you need in our gulp package build workflow
(in `gulpfile.js` `javascript` entry) like this 
(you may omit some line if you do not need these components):

``` javascript
distFiles: [
    // dependencies via npm (if you need multiselect)
    componentsFolder + 'bootstrap-multiselect/dist/js/bootstrap-multiselect.js',
    // dependencies like this or via npm
    componentsFolder + '@smply-gd/estate-library/js/dependencies/jquery-ui.min.js',
    componentsFolder + '@smply-gd/estate-library/js/dependencies/jquery.ui.touch-punch.min.js',
    componentsFolder + '@smply-gd/estate-library/js/dependencies/isotope.pkgd.min.js',
    componentsFolder + '@smply-gd/estate-library/js/dependencies/imagesloaded.pkgd.min.js',
    // jquery plugins
    componentsFolder + '@smply-gd/estate-library/js/energyefficiencydisplay.min.js',
    componentsFolder + '@smply-gd/estate-library/js/SGEstateSlider.js',
    componentsFolder + '@smply-gd/estate-library/js/SGEstateMultiselect.js',
    componentsFolder + '@smply-gd/estate-library/js/SGEstateCheckbox.js',
    // megaselect with dependency SGAutocomplete
    // you may omit those two if you do not need the megaselect 
    componentsFolder + '@smply-gd/autocomplete/js/SGAutocomplete.js',
    componentsFolder + '@smply-gd/estate-library/js/SGEstateMegaselect.js',
    // modules
    componentsFolder + '@smply-gd/estate-library/js/SGEstateFilter.js',
    componentsFolder + '@smply-gd/estate-library/js/SGEstateMaps.js',
    componentsFolder + '@smply-gd/estate-library/js/SGEstateLiveFilter.js'
],    
```

## Publish package
Log in to npm via `npm login --registry=https://npm.pkg.github.com`
and use your Github username and Github token as password. After that
use `npm publish` to push your new version to github npm package repository.