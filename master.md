1. Many times, attributes are defined in an attributes.adoc file or at the top of 'master.adoc', and the position in master.adoc. I want to render a module that is included in master.adoc, but it's included after an attribute is redefined, so I want to render module.adoc, but using the values of attributes as if it was rendered in master.adoc
--master-attributes=<path to master.adoc>

2. I want to specify alternative values for a set of attributes, eg --offer attributes.adoc
Any attributes defined can be selected by user from pulldown, ie add matching attribute values to list

Consider the best way to approach these goals
